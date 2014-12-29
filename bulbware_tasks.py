#!/usr/bin/env python
# -*- coding: utf-8 -*-

import webapp2
import json
from google.appengine.api import taskqueue

import logging

import user_model
import bulbware_model
import bulbware_lib

class deleteElements(webapp2.RequestHandler):
    def post(self, app):
        userinfo = self.request.get('userinfo')
        project = self.request.get('project')
        page = self.request.get('page')
        item = self.request.get('item')
        attribute = self.request.get('attribute')
        tags = self.request.get_all('tags[]')
        datetime1 = self.request.get('datetime1')
        datetime2 = self.request.get('datetime2')
        #
        bulbware_model.delete_elements(app, userinfo, project, page, item, attribute, tags, datetime1, datetime2)

app = webapp2.WSGIApplication([
    ('/tasks/(.*)/delete_elements', deleteElements),
], debug=True)
