#!/usr/bin/env python
# -*- coding: utf-8 -*-

import webapp2
import os
from google.appengine.ext.webapp import template
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

class getIcon(webapp2.RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = "image/png"
    key = self.request.get("key")
    userinfo = user_model.get_userinfo(key)
    if userinfo:
        icon = userinfo.icon
        if icon:
            self.response.out.write(icon)
            return
    f = open('default_icon.png', 'rb')
    self.response.out.write(f.read())

class updateProfile(webapp2.RequestHandler):
    def post(self):
        userinfo = user_model.get_login_userinfo()
        if userinfo.check_edit():
            name = self.request.get('name')
            email = self.request.get('email')
            options = self.request.get('options')
            userinfo.save(name, email, options)
        ret = {
            'object': userinfo.get_property()
            }
        bulbware_lib.write_json(self, ret);

app = webapp2.WSGIApplication([
    ('/user/', editUser),
    ('/user/api/get_profile', getProfile),
    ('/user/api/get_icon', getIcon),
    ('/user/api/update_profile', updateProfile)
], debug=True)
