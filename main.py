#!/usr/bin/env python
# -*- coding: utf-8 -*-

import webapp2
import os
from google.appengine.ext.webapp import template

class Root(webapp2.RequestHandler):
  def get(self):
    self.redirect('/dashboard/todo')

app = webapp2.WSGIApplication([
    ('/', Root)
], debug=True)
