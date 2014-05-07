#!/usr/bin/env python
# -*- coding: utf-8 -*-

from google.appengine.ext import ndb
from google.appengine.api import users
import datetime
import calendar
import pickle
import logging

import bulbware_lib

#xg_on = ndb.create_transaction_options(xg=True)

class UserInfo(ndb.Model):
    name = ndb.StringProperty()
    icon = ndb.BlobProperty()
    email = ndb.StringProperty()
    options = ndb.TextProperty()
    google_id = ndb.StringProperty()
    def get_property(self):
        return {
            'id': self.key.urlsafe(),
            'name': self.name,
            'email': self.email,
            'options': self.options
            }
    def check_edit(self):
        user = users.get_current_user()
        if user:
            if self.google_id == user.user_id():
                return True
        return False
    def save(self, name, email, options):
        self.name = name
        self.email = email
        self.options = options
        self.put()
    def save_icon(self, icon):
        pic = bulbware_lib.resize_image(icon, 120, 120)
        if pic:
            self.icon = pic
            self.put()
        

def get_login_userinfo():
    user = users.get_current_user()
    if user: # userがない場合はログインしていない
        google_id = user.user_id()
        userinfos = UserInfo.gql("where google_id=:1", google_id)
        userinfo = userinfos.get()
        if not userinfo: # userinfoがない場合は生成する
            email = user.email()
            p = email.find('@')
            name = email[:p] # メールアドレスの@の前
            userinfo = add_userinfo(name, email, google_id)
        return userinfo

def get_userinfo(key_str):
    if key_str:
        key = ndb.Key(urlsafe=key_str)
        if key.kind() == 'UserInfo':
            userinfo = key.get()
            return userinfo

def add_userinfo(name, email, google_id):
    userinfo = UserInfo()
    userinfo.name = name
    userinfo.email = email
    userinfo.google_id = google_id
    userinfo.put()
    return userinfo
