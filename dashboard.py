#!/usr/bin/env python
# -*- coding: utf-8 -*-

import webapp2
import os
from google.appengine.ext.webapp import template

class Todo(webapp2.RequestHandler):
  def get(self):
    path = os.path.join(os.path.dirname(__file__), 'index.html')
    self.response.out.write(template.render(path, {
          'app': 'todo'
          }))

app = webapp2.WSGIApplication([
    ('/dashboard/todo', Todo)
], debug=True)
