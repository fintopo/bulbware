#!/usr/bin/env python
# -*- coding: utf-8 -*-

from google.appengine.ext import ndb
from google.appengine.api import users
from google.appengine.api import memcache
import datetime
import calendar
import pickle
import json

import logging

import bulbware_lib
import user_model

class BulbwareProject(ndb.Model):
  app_name = ndb.StringProperty()
  owner = ndb.KeyProperty(user_model.UserInfo)
  name = ndb.StringProperty()
  options = ndb.TextProperty()
  tags = ndb.StringProperty(repeated=True)
  sorttext = ndb.StringProperty()
  create_datetime = ndb.DateTimeProperty(auto_now_add=True)
  update_datetime = ndb.DateTimeProperty(auto_now=True)
  def get_property(self):
    return {
      'id': self.key.urlsafe(),
      'owner_id': self.owner.urlsafe(),
      'owner_name': self.owner.get().name,
      'name': self.name,
      'options': self.options,
      'tags': self.tags,
      'sorttext': self.sorttext,
      'create_datetime': bulbware_lib.jst_date(self.create_datetime).strftime('%Y-%m-%d %H:%M:%S'),
      'update_datetime': bulbware_lib.jst_date(self.update_datetime).strftime('%Y-%m-%d %H:%M:%S')
      }
  def get_option_values(self):
    if self.options:
      return json.loads(self.options)
    else:
      return {}
  def check_edit(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def check_delete(self, userinfo):
    pages = search_pages_project(self.app_name, self)
    items = search_items_project(self.app_name, self)
    return (pages.count() == 0) and (items.count() == 0) and (self.owner.urlsafe() == userinfo.key.urlsafe())
  def save(self, userinfo, name, options, tags, sorttext=None):
      self.name = name
      self.options = options
      self.tags = tags
      if sorttext:
        self.sorttext = sorttext
      else:
        self.sorttext = name
      self.put()


def get_project(app_name, key_str):
  if key_str:
    key = ndb.Key(urlsafe=key_str)
    if key.kind() == 'BulbwareProject':
      project = key.get()
      if project.app_name == app_name:
        return project

def add_project(app_name, userinfo, name, options, tags, sorttext=None):
    project = BulbwareProject()
    project.app_name = app_name
    project.owner = userinfo.key
    project.name = name
    project.options = options
    project.tags = tags
    if sorttext:
      project.sorttext = sorttext
    else:
      project.sorttext = name
    project.put()
    return project

def search_projects_owner(app_name, userinfo, tags=None):
  q = BulbwareProject.query(BulbwareProject.app_name==app_name, BulbwareProject.owner==userinfo.key)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareProject.tags.IN(tags))
  #
  return q.order(BulbwareProject.sorttext)

def search_projects_name(app_name, name, tags=None):
  q = BulbwareProject.query(BulbwareProject.app_name==app_name, BulbwareProject.name==name)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareProject.tags.IN(tags))
  #
  return q.order(BulbwareProject.sorttext)

class BulbwarePage(ndb.Model):
  app_name = ndb.StringProperty()
  project = ndb.KeyProperty(BulbwareProject)
  owner = ndb.KeyProperty(user_model.UserInfo)
  name = ndb.StringProperty()
  options = ndb.TextProperty()
  tags = ndb.StringProperty(repeated=True)
  sorttext = ndb.StringProperty()
  create_datetime = ndb.DateTimeProperty(auto_now_add=True)
  update_datetime = ndb.DateTimeProperty(auto_now=True)
  def get_property(self):
    return {
      'id': self.key.urlsafe(),
      'project_id': self.project.urlsafe(),
      'project_name': self.project.get().name,
      'owner_id': self.owner.urlsafe(),
      'owner_name': self.owner.get().name,
      'name': self.name,
      'options': self.options,
      'tags': self.tags,
      'sorttext': self.sorttext,
      'create_datetime': bulbware_lib.jst_date(self.create_datetime).strftime('%Y-%m-%d %H:%M:%S'),
      'update_datetime': bulbware_lib.jst_date(self.update_datetime).strftime('%Y-%m-%d %H:%M:%S')
      }
  def check_edit(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def check_delete(self, userinfo):
    return self.check_edit(userinfo)
  def save(self, name, options, tags, sorttext=None, project_key=None):
    self.name = name
    self.options = options
    self.tags = tags
    if sorttext:
      self.sorttext = sorttext
    else:
      self.sorttext = name
    if project_key:
      self.project = ndb.Key(urlsafe=project_key)
    self.put()

def get_page(app_name, key_str):
  if key_str:
    key = ndb.Key(urlsafe=key_str)
    if key.kind() == 'BulbwarePage':
      page = key.get()
      if page.app_name == app_name:
        return page

def add_page(app_name, userinfo, name, options, tags, sorttext=None, project_key=None):
    page = BulbwarePage()
    page.app_name = app_name
    page.owner = userinfo.key
    page.name = name
    page.options = options
    page.tags = tags
    if sorttext:
      page.sorttext = sorttext
    else:
      page.sorttext = name
    if project_key:
      self.project = ndb.Key(urlsafe=project_key)
    page.put()
    return page

def search_pages_project(app_name, project, tags=None):
  q = BulbwarePage.query(BulbwarePage.app_name==app_name, BulbwarePage.project==project.key)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwarePage.tags.IN(tags))
  #
  return q.order(BulbwarePage.sorttext)

class BulbwareItem(ndb.Model):
  app_name = ndb.StringProperty()
  project = ndb.KeyProperty(BulbwareProject)
  owner = ndb.KeyProperty(user_model.UserInfo)
  name = ndb.StringProperty()
  options = ndb.TextProperty()
  tags = ndb.StringProperty(repeated=True)
  sorttext = ndb.StringProperty()
  create_datetime = ndb.DateTimeProperty(auto_now_add=True)
  update_datetime = ndb.DateTimeProperty(auto_now=True)
  def get_property(self):
    return {
      'id': self.key.urlsafe(),
      'project_id': self.project.urlsafe(),
      'project_name': self.project.get().name,
      'owner_id': self.owner.urlsafe(),
      'owner_name': self.owner.get().name,
      'name': self.name,
      'options': self.options,
      'tags': self.tags,
      'sorttext': self.sorttext,
      'create_datetime': bulbware_lib.jst_date(self.create_datetime).strftime('%Y-%m-%d %H:%M:%S'),
      'update_datetime': bulbware_lib.jst_date(self.update_datetime).strftime('%Y-%m-%d %H:%M:%S')
      }
  def check_edit(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def check_delete(self, userinfo):
    return self.check_edit(userinfo)
  def save(self, name, options, tags, sorttext=None, project_key=None):
    self.name = name
    self.options = options
    self.tags = tags
    if sorttext:
      self.sorttext = sorttext
    else:
      self.sorttext = name
    if project_key:
      self.project = ndb.Key(urlsafe=project_key)
    self.put()

def get_item(app_name, key_str):
  if key_str:
    key = ndb.Key(urlsafe=key_str)
    if key.kind() == 'BulbwareItem':
      item = key.get()
      if item.app_name == app_name:
        return item

def add_item(app_name, userinfo, name, options, tags, sorttext=None, project_key=None):
    item = BulbwareItem()
    item.app_name = app_name
    item.owner = userinfo.key
    item.name = name
    item.options = options
    item.tags = tags
    if sorttext:
      item.sorttext = sorttext
    else:
      item.sorttext = name
    if project_key:
      self.project = ndb.Key(urlsafe=project_key)
    item.put()
    return item

def search_items_project(app_name, project, tags=None):
  q = BulbwareItem.query(BulbwareItem.app_name==app_name, BulbwareItem.project==project.key)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareItem.tags.IN(tags))
  #
  return q.order(BulbwareItem.sorttext)

class BulbwareAttribute(ndb.Model):
  app_name = ndb.StringProperty()
  project = ndb.KeyProperty(BulbwareProject)
  owner = ndb.KeyProperty(user_model.UserInfo)
  name = ndb.StringProperty()
  options = ndb.TextProperty()
  tags = ndb.StringProperty(repeated=True)
  sorttext = ndb.StringProperty()
  create_datetime = ndb.DateTimeProperty(auto_now_add=True)
  update_datetime = ndb.DateTimeProperty(auto_now=True)
  def get_property(self):
    return {
      'id': self.key.urlsafe(),
      'project_id': self.project.urlsafe(),
      'project_name': self.project.get().name,
      'owner_id': self.owner.urlsafe(),
      'owner_name': self.owner.get().name,
      'name': self.name,
      'options': self.options,
      'tags': self.tags,
      'sorttext': self.sorttext,
      'create_datetime': bulbware_lib.jst_date(self.create_datetime).strftime('%Y-%m-%d %H:%M:%S'),
      'update_datetime': bulbware_lib.jst_date(self.update_datetime).strftime('%Y-%m-%d %H:%M:%S')
      }
  def check_edit(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def check_delete(self, userinfo):
    return self.check_edit(userinfo)
  def save(self, name, options, tags, sorttext=None, project_key=None):
    self.name = name
    self.options = options
    self.tags = tags
    if sorttext:
      self.sorttext = sorttext
    else:
      self.sorttext = name
    if project_key:
      self.project = ndb.Key(urlsafe=project_key)
    self.put()

def get_attribute(app_name, key_str):
  if key_str:
    key = ndb.Key(urlsafe=key_str)
    if key.kind() == 'BulbwareAttribute':
      attribute = key.get()
      if attribute.app_name == app_name:
        return attribute

def add_attribute(app_name, userinfo, name, options, tags, sorttext=None, project_key=None):
    attribute = BulbwareAttribute()
    attribute.app_name = app_name
    attribute.owner = userinfo.key
    attribute.name = name
    attribute.options = options
    attribute.tags = tags
    if sorttext:
      attribute.sorttext = sorttext
    else:
      attribute.sorttext = name
    if project_key:
      attribute.project = ndb.Key(urlsafe=project_key)
    attribute.put()
    return attribute

def search_attributes_project(app_name, project, tags=None):
  q = BulbwareAttribute.query(BulbwareAttribute.app_name==app_name, BulbwareAttribute.project==project.key)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareAttribute.tags.IN(tags))
  #
  return q.order(BulbwareAttribute.sorttext)


class BulbwareElement(ndb.Model):
  app_name = ndb.StringProperty()
  project = ndb.KeyProperty(BulbwareProject)
  owner = ndb.KeyProperty(user_model.UserInfo)
  page = ndb.KeyProperty(BulbwarePage)
  item = ndb.KeyProperty(BulbwareItem)
  attribute = ndb.KeyProperty(BulbwareAttribute)
  options = ndb.TextProperty()
  tags = ndb.StringProperty(repeated=True)
  sorttext = ndb.StringProperty()
  element_datetime = ndb.DateTimeProperty()
  create_datetime = ndb.DateTimeProperty(auto_now_add=True)
  update_datetime = ndb.DateTimeProperty(auto_now=True)
  def get_property(self):
    ret = {
      'id': self.key.urlsafe(),
      'project_id': '',
      'project': '',
      'page_id': '',
      'page': '',
      'item_id': '',
      'item': '',
      'attribute_id': '',
      'attribute': '',
      'options': self.options,
      'tags': self.tags,
      'sorttext': self.sorttext,
      'element_datetime': bulbware_lib.jst_date(self.element_datetime).strftime('%Y-%m-%d %H:%M:%S') if self.element_datetime else '',
      'create_datetime': bulbware_lib.jst_date(self.create_datetime).strftime('%Y-%m-%d %H:%M:%S'),
      'update_datetime': bulbware_lib.jst_date(self.update_datetime).strftime('%Y-%m-%d %H:%M:%S')
      }
    if self.project:
      ret['project_id'] = self.project.urlsafe()
      ret['project'] = self.project.get().get_property()
    if self.page:
      ret['page_id'] = self.page.urlsafe()
      ret['page'] = self.page.get().get_property()
    if self.item:
      ret['item_id'] = self.item.urlsafe()
      ret['item'] = self.item.get().get_property()
    if self.attribute:
      ret['attribute_id'] = self.attribute.urlsafe()
      ret['attribute'] = self.attribute.get().get_property()
    return ret
  def check_edit(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def check_delete(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def save(self, options, tags, sorttext=None, element_datetime=None, project_key=None, page_key=None, item_key=None, attribute_key=None):
      self.options = options
      self.tags = tags
      if sorttext:
        self.sorttext = sorttext
      else:
        self.sorttext = element_datetime
      logging.info(element_datetime)
      if element_datetime:
        self.element_datetime = bulbware_lib.utc_date(bulbware_lib.parse_datetime(element_datetime))
      else:
        self.element_datetime = None
      if project_key:
        self.project = ndb.Key(urlsafe=project_key)
      if page_key:
        self.page = ndb.Key(urlsafe=page_key)
      if item_key:
        self.item = ndb.Key(urlsafe=item_key)
      if attribute_key:
        self.attribute = ndb.Key(urlsafe=attribute_key)
      self.put()

def get_element(app_name, key_str):
  if key_str:
    key = ndb.Key(urlsafe=key_str)
    if key.kind() == 'BulbwareElement':
      element = key.get()
      if element.app_name == app_name:
        return element

def add_element(app_name, userinfo, options, tags, sorttext=None, element_datetime=None, project_key=None, page_key=None, item_key=None, attribute_key=None):
    element = BulbwareElement()
    element.app_name = app_name
    element.owner = userinfo.key
    element.options = options
    element.tags = tags
    if sorttext:
      element.sorttext = sorttext
    else:
      element.sorttext = element_datetime
    if element_datetime:
      element.element_datetime = bulbware_lib.utc_date(bulbware_lib.parse_datetime(element_datetime))
    else:
      element.element_datetime = None
    if project_key:
      element.project = ndb.Key(urlsafe=project_key)
    if page_key:
      element.page = ndb.Key(urlsafe=page_key)
    if item_key:
      element.item = ndb.Key(urlsafe=item_key)
    if attribute_key:
      element.attribute = ndb.Key(urlsafe=attribute_key)
    element.put()
    return element

def search_elements_project(app_name, project, tags=None):
  q = BulbwareElement.query(BulbwareElement.app_name==app_name, BulbwareElement.project==project.key)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareElement.tags.IN(tags))
  #
  return q.order(-BulbwareElement.sorttext)

def search_elements_page(app_name, page, tags=None):
  q = BulbwareElement.query(BulbwareElement.app_name==app_name, BulbwareElement.page==page.key)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareElement.tags.IN(tags))
  #
  return q.order(-BulbwareElement.sorttext)

def search_elements_item(app_name, item, tags=None):
  q = BulbwareElement.query(BulbwareElement.app_name==app_name, BulbwareElement.item==item.key)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareElement.tags.IN(tags))
  #
  return q.order(-BulbwareElement.sorttext)

def search_elements_attribute(app_name, attribute, tags=None):
  q = BulbwareElement.query(BulbwareElement.app_name==app_name, BulbwareElement.attribute==attribute.key)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareElement.tags.IN(tags))
  #
  return q.order(-BulbwareElement.sorttext)
