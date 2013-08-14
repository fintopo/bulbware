#!/usr/bin/env python
# -*- coding: utf-8 -*-

from google.appengine.ext import ndb
from google.appengine.api import users
from google.appengine.api import memcache
import datetime
import calendar
import pickle
import logging

import bulbware_lib
import user_model

class TodoProject(ndb.Model):
  app_name = ndb.StringProperty()
  owner = ndb.KeyProperty(user_model.UserInfo)
  name = ndb.StringProperty()
  options = ndb.TextProperty()
  tags = ndb.StringProperty(repeated=True)
  def get_property(self):
    return {
      'id': self.key.urlsafe(),
      'name': self.name,
      'options': self.options,
      'tags': self.tags
      }
  def check_edit(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def check_delete(self, userinfo):
    tasks = search_tasks_owner(self.app_name, self)
    if tasks.count() == 0:
      return (self.owner.urlsafe() == userinfo.key.urlsafe())
    else:
      return False
  def save(self, userinfo, name, options):
    if self.check_edit(userinfo):
      self.name = name
      self.options = options
      self.put()
      return True
    return False

def get_project(app_name, key_str):
  if key_str:
    key = ndb.Key(urlsafe=key_str)
    if key.kind() == 'TodoProject':
      project = key.get()
      if project.app_name == app_name:
        return project

def add_project(app_name, userinfo, name, options):
    project = TodoProject()
    project.app_name = app_name
    project.owner = userinfo.key
    project.name = name
    project.options = options
    project.put()
    return project

def search_projects_owner(app_name, userinfo):
  q = TodoProject.query(TodoProject.app_name==app_name, TodoProject.owner==userinfo.key)
  return q.order(TodoProject.name)

class TodoTask(ndb.Model):
  app_name = ndb.StringProperty()
  project = ndb.KeyProperty(TodoProject)
  owner = ndb.KeyProperty(user_model.UserInfo)
  name = ndb.StringProperty()
  memo = ndb.TextProperty()
  options = ndb.TextProperty()
  tags = ndb.StringProperty(repeated=True)
  start_datetime = ndb.DateTimeProperty()
  due_datetime = ndb.DateTimeProperty()
  completed = ndb.BooleanProperty()
  def get_property(self):
    start_datetime = ''
    if self.start_datetime:
      start_datetime = bulbware_lib.jst_date(self.start_datetime).strftime('%Y-%m-%d %H:%M:%S')
    due_datetime = ''
    if self.due_datetime:
      due_datetime = bulbware_lib.jst_date(self.due_datetime).strftime('%Y-%m-%d %H:%M:%S')
    return {
      'id': self.key.urlsafe(),
      'project_id': self.project.urlsafe(),
      'project_name': self.project.get().name,
      'owner_id': self.owner.urlsafe(),
      'owner_name': self.owner.get().name,
      'name': self.name,
      'options': self.options,
      'tags': self.tags,
      'start_datetime': start_datetime,
      'due_datetime': due_datetime,
      'completed': self.completed,
      'tags': self.tags
      }
  def check_edit(self, userinfo):
    return (self.owner.urlsafe() == userinfo.key.urlsafe())
  def check_delete(self, userinfo):
    return self.check_edit(userinfo)
  def save(self, userinfo, name, options, start_datetime, due_datetime, completed, tags):
    if self.check_edit(userinfo):
      self.name = name
      self.options = options
      #
      if start_datetime:
        start_datetime = bulbware_lib.utc_date(bulbware_lib.parse_datetime(start_datetime))
        self.start_datetime = start_datetime
      else:
        self.start_datetime = None
      #
      if due_datetime:
        due_datetime = bulbware_lib.utc_date(bulbware_lib.parse_datetime(due_datetime))
        self.due_datetime = due_datetime
      else:
        self.due_datetime = None
      #
      self.completed = completed
      self.tags = tags
      self.put()
      return True
    return False

def get_task(app_name, key_str):
  if key_str:
    key = ndb.Key(urlsafe=key_str)
    if key.kind() == 'TodoTask':
      task = key.get()
      if task.app_name == app_name:
        return task

def add_task(app_name, project, userinfo, name, options, start_datetime, due_datetime, completed, tags):
    task = TodoTask()
    task.app_name = app_name
    task.project = project.key
    task.owner = userinfo.key
    task.name = name
    task.options = options
    #
    if start_datetime:
      start_datetime = bulbware_lib.utc_date(bulbware_lib.parse_datetime(start_datetime))
      task.start_datetime = start_datetime
    else:
      task.start_datetime = None
    #
    if due_datetime:
      due_datetime = bulbware_lib.utc_date(bulbware_lib.parse_datetime(due_datetime))
      task.due_datetime = due_datetime
    else:
      task.due_datetime = None
    #
    task.completed = completed
    task.tags = tags
    task.put()
    return task

def search_tasks_owner(app_name, project, tags=None):
  q = TodoTask.query(TodoTask.app_name==app_name, TodoTask.project==project.key);
  #
  if tags:
    while tags.count('') > 0:
      tags.remove('')
    if tags and (len(tags) > 0):
      q = q.filter(TodoTask.tags.IN(tags))
  #
  return q.order(TodoTask.start_datetime);
