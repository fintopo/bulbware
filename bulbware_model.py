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
  def get_owner(self):
    return self.owner.get()
  def get_pages(self):
    return search_pages_project(self.app_name, self)
  def get_items(self):
    return search_items_project(self.app_name, self)
  def check_edit(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def check_delete(self, userinfo):
    pages = self.get_pages()
    items = self.get_items()
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
  def inTag(self, tag):
    return (tag in self.tags)


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
    project.save(userinfo, name, options, tags, sorttext)
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

def search_projects_tags(app_name, tags=None):
  q = BulbwareProject.query(BulbwareProject.app_name==app_name)
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
    ret = {
      'id': self.key.urlsafe(),
      'project': '',
      'owner_id': self.owner.urlsafe(),
      'owner_name': self.owner.get().name,
      'name': self.name,
      'options': self.options,
      'tags': self.tags,
      'sorttext': self.sorttext,
      'create_datetime': bulbware_lib.jst_date(self.create_datetime).strftime('%Y-%m-%d %H:%M:%S'),
      'update_datetime': bulbware_lib.jst_date(self.update_datetime).strftime('%Y-%m-%d %H:%M:%S')
      }
    if self.project:
      ret['project'] = self.project.get().get_property()
    return ret
  def get_option_values(self):
    if self.options:
      return json.loads(self.options)
    else:
      return {}
  def get_owner(self):
    return self.owner.get()
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
    page.save(name, options, tags, sorttext, project_key)
    return page

def search_pages(app_name, userinfo=None, project=None, tags=None, order=True):
  q = BulbwarePage.query(BulbwarePage.app_name==app_name)
  #
  if userinfo:
    q = q.filter(BulbwarePage.owner==bulbware_lib.get_key(userinfo, user_model.UserInfo))
  #
  if project:
    q = q.filter(BulbwarePage.project==bulbware_lib.get_key(project, BulbwareProject))
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwarePage.tags.IN(tags))
  #
  if order:
    return q.order(BulbwarePage.sorttext)
  else:
    return q

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
  def get_option_values(self):
    if self.options:
      return json.loads(self.options)
    else:
      return {}
  def get_owner(self):
    return self.owner.get()
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
    item.save(name, options, tags, sorttext, project_key)
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
    ret = {
      'id': self.key.urlsafe(),
      'project_id': '',
      'project': '',
      'owner_id': self.owner.urlsafe(),
      'owner_name': self.owner.get().name,
      'name': self.name,
      'options': self.options,
      'tags': self.tags,
      'sorttext': self.sorttext,
      'create_datetime': bulbware_lib.jst_date(self.create_datetime).strftime('%Y-%m-%d %H:%M:%S'),
      'update_datetime': bulbware_lib.jst_date(self.update_datetime).strftime('%Y-%m-%d %H:%M:%S')
      }
    if self.project:
      ret['project_id'] = self.project.key.urlsafe()
      ret['project'] = self.project.get().get_property()
    return ret
  def get_option_values(self):
    if self.options:
      return json.loads(self.options)
    else:
      return {}
  def get_owner(self):
    return self.owner.get()
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
    self.project = bulbware_lib.get_key(project_key, BulbwareProject)
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
    attribute.save(name, options, tags, sorttext, project_key)
    return attribute

def search_attributes_owner(app_name, userinfo, tags=None):
  q = BulbwareAttribute.query(BulbwareAttribute.app_name==app_name, BulbwareAttribute.owner==userinfo.key)
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareAttribute.tags.IN(tags))
  #
  return q.order(BulbwareAttribute.sorttext)

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
  def get_option_values(self):
    if self.options:
      return json.loads(self.options)
    else:
      return {}
  def get_owner(self):
    return self.owner.get()
  def check_edit(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def check_delete(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def save(self, options, tags, sorttext=None, element_datetime=None, project=None, page=None, item=None, attribute=None):
      self.options = options
      self.tags = tags
      if sorttext:
        self.sorttext = sorttext
      else:
        self.sorttext = element_datetime
      if element_datetime:
        self.element_datetime = bulbware_lib.utc_date(bulbware_lib.parse_datetime(element_datetime))
      else:
        self.element_datetime = None
      self.project = bulbware_lib.get_key(project, BulbwareProject)
      self.page = bulbware_lib.get_key(page, BulbwarePage)
      self.item = bulbware_lib.get_key(item, BulbwareItem)
      self.attribute = bulbware_lib.get_key(attribute, BulbwareAttribute)
      self.put()

def get_element(app_name, key_str):
  if key_str:
    key = ndb.Key(urlsafe=key_str)
    if key.kind() == 'BulbwareElement':
      element = key.get()
      if element.app_name == app_name:
        return element

def add_element(app_name, userinfo, options, tags, sorttext=None, element_datetime=None, project=None, page=None, item=None, attribute=None):
    element = BulbwareElement()
    element.app_name = app_name
    element.owner = userinfo.key
    element.save(options, tags, sorttext, element_datetime, project, page, item, attribute)
    return element

def search_elements(app_name, userinfo=None, project=None, page=None, item=None, attribute=None, tags=None, datetime1=None, datetime2=None, order=True):
  q = BulbwareElement.query(BulbwareElement.app_name==app_name)
  #
  if userinfo:
    q = q.filter(BulbwareElement.owner==bulbware_lib.get_key(userinfo, user_model.UserInfo))
  #
  if project:
    q = q.filter(BulbwareElement.project==bulbware_lib.get_key(project, BulbwareProject))
  #
  if page:
    q = q.filter(BulbwareElement.page==bulbware_lib.get_key(page, BulbwarePage))
  #
  if item:
    q = q.filter(BulbwareElement.item==bulbware_lib.get_key(item, BulbwareItem))
  #
  if attribute:
    q = q.filter(BulbwareElement.attribute==bulbware_lib.get_key(attribute, BulbwareAttribute))
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(BulbwareElement.tags.IN(tags))
  #
  if datetime1:
    q = q.filter(BulbwareElement.element_datetime>=bulbware_lib.get_datetime(datetime1))
  if datetime2:
    q = q.filter(BulbwareElement.element_datetime<=bulbware_lib.get_datetime(datetime2))
  #
  if order:
    return q.order(BulbwareElement.sorttext)
  else:
    return q

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

def delete_elements(app_name, userinfo=None, project=None, page=None, item=None, attribute=None, tags=None, datetime1=None, datetime2=None):
  q = search_elements(app_name, userinfo, project, page, item, attribute, tags, datetime1, datetime2)
  ndb.delete_multi(q.fetch(keys_only=True))
