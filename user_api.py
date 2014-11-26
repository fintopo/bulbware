#!/usr/bin/env python
# -*- coding: utf-8 -*-

import webapp2
import os
from google.appengine.ext.webapp import template
from google.appengine.api import users
import re

import logging

import user_model
import bulbware_lib

class editUser(webapp2.RequestHandler):
  def get(self):
    path = os.path.join(os.path.dirname(__file__), 'index.html')
    self.response.out.write(template.render(path, {
          'app': 'user'
          }))

class getProfile(webapp2.RequestHandler):
    def get(self):
        userinfo = user_model.get_login_userinfo()
        ret = userinfo.get_property()
        bulbware_lib.write_json(self, ret);

class updateProfile(webapp2.RequestHandler):
    def post(self):
        userinfo = user_model.get_login_userinfo()
        if userinfo.check_edit():
            name = self.request.get('name')
            email = self.request.get('email')
            memo = self.request.get('memo')
            options = self.request.get('options')
            userinfo.save(name, email, memo, options)
        ret = {
            'object': userinfo.get_property()
            }
        bulbware_lib.write_json(self, ret);

class appendIcon(webapp2.RequestHandler):
    def post(self):
        userinfo = user_model.get_login_userinfo()
        file = self.request.get('file') 
        #
        if userinfo:
          blob_key = userinfo.save_icon(file)
          #
          ret = {
            'blob_key': str(blob_key)
            }
          bulbware_lib.write_json(self, ret);

class LogoutUser(webapp2.RequestHandler):
  def get(self):
    self.redirect(users.create_logout_url('/'))

app = webapp2.WSGIApplication([
    ('/user/', editUser),
    ('/user/api/get_profile', getProfile),
    ('/user/api/update_profile', updateProfile),
    ('/user/api/append_icon', appendIcon),
    ('/user/logout', LogoutUser)
], debug=True)
