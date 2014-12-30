#!/usr/bin/env python
# -*- coding: utf-8 -*-

import webapp2
import os
from google.appengine.ext.webapp import template
from google.appengine.api import images
from google.appengine.ext import blobstore
import datetime

import logging

import user_model
import bulbware_model
import bulbware_lib

class Root(webapp2.RequestHandler):
  def get(self):
    self.redirect('/dashboard/')

class Icon(webapp2.RequestHandler):
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

class Picture(webapp2.RequestHandler):
    def get(self):
      key = self.request.get('key')
      if key:
        blobinfo = blobstore.BlobInfo.get(key)
        if blobinfo:
          lastmod = blobinfo.creation
          if self.request.headers.has_key('If-Modified-Since'):
            modsince = self.request.headers.get('If-Modified-Since')
            if modsince == lastmod.strftime("%a, %d %b %Y %H:%M:%S GMT"):
              self.error(304)
              return
          #
          blob = bulbware_lib.get_blob(key)
          if blob:
            img = images.Image(blob)
            if img.format == images.PNG:
              self.response.content_type = 'image/png'
            elif img.format == images.JPEG:
              self.response.content_type = 'image/jpeg'
            else:
              self.response.content_type = 'application/octet-stream'
            # キャッシュさせる
            expires_day = 3
            self.response.headers['Cache-Control']='public, max-age='+str(expires_day*60*60*24)
            self.response.headers['Last-Modified'] = lastmod.strftime("%a, %d %b %Y %H:%M:%S GMT")
            expires = lastmod + datetime.timedelta(days=expires_day)
            self.response.headers['Expires'] = expires.strftime("%a, %d %b %Y %H:%M:%S GMT")
            #
            self.response.out.write(blob)
            return
      self.response.headers['Content-Type'] = "image/png"
      f = open('dummy.png', 'rb')
      self.response.out.write(f.read())

app = webapp2.WSGIApplication([
    ('/', Root)
    ,('/icon', Icon)
    ,('/picture', Picture)
], debug=True)
