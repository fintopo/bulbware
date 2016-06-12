#!/usr/bin/env python
# -*- coding: utf-8 -*-

#2011/07/07
#  追加：parse_datetime

import datetime
from google.appengine.api import users
from google.appengine.api import images
from google.appengine.ext import ndb
import json
import os
from google.appengine.ext.webapp import template
import logging

from google.appengine.ext import blobstore
from google.appengine.api import files

def write_json(self, data):
    json_str = json.dumps(data, ensure_ascii=False) 
    self.response.content_type = 'application/json'
    self.response.out.write(json_str)

def unique(seq):
    new_list = []
    new_list_add = new_list.append
    seen = set()
    seen_add = seen.add
    for item in seq:
        if item not in seen:
            seen_add(item)
            new_list_add(item)
    return new_list

def split_strip(str, sep):
    items = str.split(sep)
    ret = []
    for item in items:
        s = item.strip()
        if len(s) > 0:
            ret.append(s)
    return ret

class UtcTzinfo(datetime.tzinfo): 
    def utcoffset(self, dt): 
        return datetime.timedelta(0) 

    def dst(self, dt): 
        return datetime.timedelta(0) 

    def tzname(self, dt): 
        return 'UTC' 

    def olsen_name(self): 
        return 'UTC' 

class JstTzinfo(datetime.tzinfo): 
    def utcoffset(self, dt): 
        return datetime.timedelta(hours=9) 

    def dst(self, dt): 
        return datetime.timedelta(0) 

    def tzname(self, dt): 
        return 'JST' 

    def olsen_name(self): 
        return 'Asia/Tokyo' 


def jst_date(value=None): 
    if not value: 
        value = datetime.datetime.now() 
    value = value.replace(tzinfo=UtcTzinfo()).astimezone(JstTzinfo()) 
    return value.replace(tzinfo=None)

def utc_date(value=None): 
    if value: 
      value = value.replace(tzinfo=JstTzinfo()).astimezone(UtcTzinfo()) 
    else:
      value = datetime.datetime.now() 
    return value.replace(tzinfo=None)

def parse_datetime(date=None):
    if date:
        t = datetime.datetime.strptime(date.replace('-', '/'), "%Y/%m/%d %H:%M:%S")
    else:
        t = datetime.datetime.now()
    return datetime.datetime(t.year, t.month, t.day, t.hour, t.minute, t.second)

def parse_date(date=None):
    if date:
        t = datetime.datetime.strptime(date.replace('-', '/'), "%Y/%m/%d")
    else:
        t = datetime.datetime.now()
    return datetime.date(t.year, t.month, t.day)


def resize_image(picture, width, height):
    if picture:
        try:
            img = images.Image(picture)
            if img.width > img.height:
                if img.width > width:
                    h = width / img.width * img.height
                    img.resize(width, h)
            else:
                if img.height > height:
                    w = height / img.width * img.height
                    img.resize(w, height)
            return img.execute_transforms(output_encoding=images.JPEG)
        except:
            logging.error('resize_image in bulbware_lib.py')
            return picture


def set_blob(value, mime_type):
    blob_io = files.blobstore.create(mime_type=mime_type)
    with files.open(blob_io, 'a') as f:
        f.write(value)
    files.finalize(blob_io)
    return files.blobstore.get_blob_key(blob_io)
        

def get_blob(blob_key):
    ret = ''
    try:
        p0 = 0
        p1 = blobstore.MAX_BLOB_FETCH_SIZE - 1
        s = '0'
        while len(s) > 0:
            s = blobstore.fetch_data(blob_key, p0, p1)
            ret += s
            p0 = p1 + 1
            p1 = p0 + blobstore.MAX_BLOB_FETCH_SIZE - 1
    except:
        pass
    return ret 

def get_key(value, type_class):
    if not value:
        value = None
    elif isinstance(value, type_class):
        value = value.key
    elif isinstance(value, basestring):
        value = ndb.Key(urlsafe=value)
    return value

def get_number(value):
    if isinstance(value, basestring):
        if value:
            value = float(value)
        else:
            value = 0
    return value

def get_integer(value):
    if isinstance(value, basestring):
        if value:
            value = int(value)
        else:
            value = 0
    return value

def get_datetime(value):
    if isinstance(value, basestring):
        if value:
            value = utc_date(parse_datetime(value))
        else:
            value = None
    return value

