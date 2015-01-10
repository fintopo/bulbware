#!/usr/bin/env python
# -*- coding: utf-8 -*-

import webapp2
import json
from google.appengine.api import taskqueue
from google.appengine.ext import blobstore

import logging

import user_model
import bulbware_model
import bulbware_lib

class searchProjects(webapp2.RequestHandler):
    def get(self, app):
        userinfo = user_model.get_login_userinfo()
        projects = bulbware_model.search_projects_owner(app, userinfo)
        #
        ret = [];
        for project in projects:
            ret.append(project.get_property())
        # プロジェクトがなく、create_nameが指定されている場合は、プロジェクトを生成する
        create_name = self.request.get('create_name')
        if (projects.count() == 0) and create_name:
            options = self.request.get('create_options')
            project = bulbware_model.add_project(app, userinfo, create_name, options, [])
            ret.append(project.get_property())
        #
        bulbware_lib.write_json(self, ret);

class getProject(webapp2.RequestHandler):
    def get(self, app):
        key = self.request.get('id')
        project = bulbware_model.get_project(app, key)
        if project:
            if project.check_edit():
                ret = project.get_property()
                bulbware_lib.write_json(self, ret);

class updateProject(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('id')
        name = self.request.get('name')
        options = self.request.get('options')
        tags = self.request.get_all('tags[]')
        sorttext = self.request.get('sorttext')
        #
        project = bulbware_model.get_project(app, key)
        if project:
            if project.check_edit(userinfo):
                project.save(userinfo, name, options, tags, sorttext)
        else:
            project = bulbware_model.add_project(app, userinfo, name, options, tags, sorttext)
        ret = {
            'object': project.get_property()
            }
        bulbware_lib.write_json(self, ret);

class deleteProject(webapp2.RequestHandler):
    def post(self, app):
        key = self.request.get('id')
        project = bulbware_model.get_project(app, key)
        if project:
            userinfo = user_model.get_login_userinfo()
            if project.check_delete(userinfo):
                data = project.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                #
                project.key.delete();
                #
                ret = {}
                bulbware_lib.write_json(self, ret);
                #
                return
        self.error(403)

class appendFileToProject(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('project_id')
        file = self.request.get('file') 
        #
        project = bulbware_model.get_project(app, key)
        if project:
            if project.check_edit(userinfo):
                # ファイルをblobstoreに保存
                pic = bulbware_lib.resize_image(file, 800, 800)
                blob_key = bulbware_lib.set_blob(pic, 'image/jpeg')
                # blob_keyをリンクに保存
                data = project.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                data['image'] = str(blob_key)
                project.options = json.dumps(data, ensure_ascii=False)
                project.put()
                #
                ret = {
                    'blob_key': str(blob_key)
                    }
                bulbware_lib.write_json(self, ret);

class searchPages(webapp2.RequestHandler):
    def get(self, app):
        userinfo = user_model.get_login_userinfo()
        project = self.request.get('project')
        tags = self.request.get_all('tags[]')
        create_name = self.request.get('create_name')
        create_options = self.request.get('create_options')
        #
        pages = bulbware_model.search_pages(app, userinfo, project, tags)
        ret = [];
        for page in pages:
            ret.append(page.get_property())
        # プロジェクトがなく、create_nameが指定されている場合は、プロジェクトを生成する
        if (pages.count() == 0) and create_name:
            page = bulbware_model.add_page(app, userinfo, create_name, create_options, [], create_name, project)
            ret.append(page.get_property())
        #
        bulbware_lib.write_json(self, ret);

class getPage(webapp2.RequestHandler):
    def get(self, app):
        key = self.request.get('id')
        page = bulbware_model.get_page(app, key)
        if page:
            if page.check_edit():
                ret = page.get_property()
                bulbware_lib.write_json(self, ret);

class updatePage(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('id')
        name = self.request.get('name')
        options = self.request.get('options')
        tags = self.request.get_all('tags[]')
        sorttext = self.request.get('sorttext')
        project_key = self.request.get('project_id')
        #
        page = bulbware_model.get_page(app, key)
        if page:
            if page.check_edit(userinfo):
                page.save(name, options, tags, sorttext, project_key)
            else:
                self.error(403)
        else:
            page = bulbware_model.add_page(app, userinfo, name, options, tags, sorttext, project_key)
        if page:
            ret = {
                'object': page.get_property()
                }
        else:
            ret = {}
        bulbware_lib.write_json(self, ret);

class deletePage(webapp2.RequestHandler):
    def post(self, app):
        key = self.request.get('id')
        page = bulbware_model.get_page(app, key)
        if page:
            userinfo = user_model.get_login_userinfo()
            if page.check_delete(userinfo):
                data = page.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                #
                page.key.delete();
                #
                ret = {}
                bulbware_lib.write_json(self, ret);
                #
                return
        self.error(403)

class appendFileToPage(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('page_id')
        file = self.request.get('file') 
        #
        page = bulbware_model.get_page(app, key)
        if page:
            if page.check_edit(userinfo):
                # ファイルをblobstoreに保存
                pic = bulbware_lib.resize_image(file, 800, 800)
                blob_key = bulbware_lib.set_blob(pic, 'image/jpeg')
                # blob_keyをリンクに保存
                data = page.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                data['image'] = str(blob_key)
                page.options = json.dumps(data, ensure_ascii=False)
                page.put()
                #
                ret = {
                    'blob_key': str(blob_key)
                    }
                bulbware_lib.write_json(self, ret);

class searchItems(webapp2.RequestHandler):
    def get(self, app):
        userinfo = user_model.get_login_userinfo()
        project_key = self.request.get('project')
        project = bulbware_model.get_project(app, project_key);
        ret = [];
        if project:
            tags = self.request.get_all('tags[]')
            #
            if project.check_edit(userinfo):
                items = bulbware_model.search_items_project(app, project, tags)
                for item in items:
                    ret.append(item.get_property())
        bulbware_lib.write_json(self, ret);

class getItem(webapp2.RequestHandler):
    def get(self, app):
        key = self.request.get('id')
        item = bulbware_model.get_item(app, key)
        if item:
            if item.check_edit():
                ret = item.get_property()
                bulbware_lib.write_json(self, ret);

class updateItem(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('id')
        name = self.request.get('name')
        options = self.request.get('options')
        tags = self.request.get_all('tags[]')
        sorttext = self.request.get('sorttext')
        project_key = self.request.get('project_id')
        #
        item = bulbware_model.get_item(app, key)
        if item:
            if item.check_edit(userinfo):
                item.save(name, options, tags, sorttext, project_key)
            else:
                self.error(403)
        else:
            item = bulbware_model.add_item(app, userinfo, name, options, tags, sorttext, project_key)
        if item:
            ret = {
                'object': item.get_property()
                }
        else:
            ret = {}
        bulbware_lib.write_json(self, ret);

class deleteItem(webapp2.RequestHandler):
    def post(self, app):
        key = self.request.get('id')
        item = bulbware_model.get_item(app, key)
        if item:
            userinfo = user_model.get_login_userinfo()
            if item.check_delete(userinfo):
                data = item.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                #
                item.key.delete();
                #
                ret = {}
                bulbware_lib.write_json(self, ret);
                #
                return
        self.error(403)

class appendFileToItem(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('item_id')
        file = self.request.get('file') 
        #
        item = bulbware_model.get_item(app, key)
        if item:
            if item.check_edit(userinfo):
                # ファイルをblobstoreに保存
                pic = bulbware_lib.resize_image(file, 800, 800)
                blob_key = bulbware_lib.set_blob(pic, 'image/jpeg')
                # blob_keyをリンクに保存
                data = item.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                data['image'] = str(blob_key)
                item.options = json.dumps(data, ensure_ascii=False)
                item.put()
                #
                ret = {
                    'blob_key': str(blob_key)
                    }
                bulbware_lib.write_json(self, ret);

class searchAttributes(webapp2.RequestHandler):
    def get(self, app):
        userinfo = user_model.get_login_userinfo()
        project_key = self.request.get('project')
        tags = self.request.get_all('tags[]')
        #
        if project_key:
            project = bulbware_model.get_project(app, project_key);
            if project:
                if project.check_edit(userinfo):
                    attributes = bulbware_model.search_attributes_project(app, project, tags)
        else:
            attributes = bulbware_model.search_attributes_owner(app, userinfo, tags)
        #
        ret = [];
        for attribute in attributes:
            ret.append(attribute.get_property())
        # プロジェクトがなく、create_nameが指定されている場合は生成する
        create_name = self.request.get('create_name')
        if (attributes.count() == 0) and create_name:
            options = self.request.get('create_options')
            attribute = bulbware_model.add_attribute(app, userinfo, create_name, options, [])
            ret.append(attribute.get_property())
        #
        bulbware_lib.write_json(self, ret);

class getAttribute(webapp2.RequestHandler):
    def get(self, app):
        key = self.request.get('id')
        attribute = bulbware_model.get_attribute(app, key)
        if attribute:
            if attribute.check_edit():
                ret = attribute.get_property()
                bulbware_lib.write_json(self, ret);

class updateAttribute(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('id')
        name = self.request.get('name')
        options = self.request.get('options')
        tags = self.request.get_all('tags[]')
        sorttext = self.request.get('sorttext')
        project_key = self.request.get('project_id')
        #
        attribute = bulbware_model.get_attribute(app, key)
        if attribute:
            if attribute.check_edit(userinfo):
                attribute.save(name, options, tags, sorttext, project_key)
            else:
                self.error(403)
        else:
            attribute = bulbware_model.add_attribute(app, userinfo, name, options, tags, sorttext, project_key)
        if attribute:
            ret = {
                'object': attribute.get_property()
                }
        else:
            ret = {}
        bulbware_lib.write_json(self, ret);

class deleteAttribute(webapp2.RequestHandler):
    def post(self, app):
        key = self.request.get('id')
        attribute = bulbware_model.get_attribute(app, key)
        if attribute:
            userinfo = user_model.get_login_userinfo()
            if attribute.check_delete(userinfo):
                data = attribute.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                #
                attribute.key.delete();
                #
                ret = {}
                bulbware_lib.write_json(self, ret);
                #
                return
        self.error(403)

class appendFileToAttribute(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('attribute_id')
        file = self.request.get('file') 
        #
        attribute = bulbware_model.get_attribute(app, key)
        if attribute:
            if attribute.check_edit(userinfo):
                # ファイルをblobstoreに保存
                pic = bulbware_lib.resize_image(file, 800, 800)
                blob_key = bulbware_lib.set_blob(pic, 'image/jpeg')
                # blob_keyをリンクに保存
                data = attribute.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                data['image'] = str(blob_key)
                attribute.options = json.dumps(data, ensure_ascii=False)
                attribute.put()
                #
                ret = {
                    'blob_key': str(blob_key)
                    }
                bulbware_lib.write_json(self, ret);

class searchElements(webapp2.RequestHandler):
    def get(self, app):
        userinfo = user_model.get_login_userinfo()
        project_key = self.request.get('project')
        project = bulbware_model.get_project(app, project_key);
        ret = [];
        if project:
            tags = self.request.get_all('tags[]')
            #
            if project.check_edit(userinfo):
                elements = bulbware_model.search_elements_project(app, project, tags)
                for element in elements:
                    ret.append(element.get_property())
        bulbware_lib.write_json(self, ret);

class getElement(webapp2.RequestHandler):
    def get(self, app):
        key = self.request.get('id')
        element = bulbware_model.get_element(app, key)
        if element:
            if element.check_edit():
                ret = element.get_property()
                bulbware_lib.write_json(self, ret);

class updateElement(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('id')
        options = self.request.get('options')
        tags = self.request.get_all('tags[]')
        sorttext = self.request.get('sorttext')
        element_datetime = self.request.get('element_datetime')
        project_key = self.request.get('project_id')
        page_key = self.request.get('page_id')
        item_key = self.request.get('item_id')
        attribute_key = self.request.get('attribute_id')
        #
        element = bulbware_model.get_element(app, key)
        if element:
            if element.check_edit(userinfo):
                element.save(options, tags, sorttext, element_datetime, project_key, page_key, item_key, attribute_key)
            else:
                self.error(403)
        else:
            element = bulbware_model.add_element(app, userinfo, options, tags, sorttext, element_datetime, project_key, page_key, item_key, attribute_key)
        if element:
            ret = {
                'object': element.get_property()
                }
        else:
            ret = {}
        bulbware_lib.write_json(self, ret);

class deleteElement(webapp2.RequestHandler):
    def post(self, app):
        key = self.request.get('id')
        element = bulbware_model.get_element(app, key)
        if element:
            userinfo = user_model.get_login_userinfo()
            if element.check_delete(userinfo):
                data = element.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                #
                element.key.delete();
                #
                ret = {}
                bulbware_lib.write_json(self, ret);
                #
                return
        self.error(403)

class deleteElements(webapp2.RequestHandler):
    def post(self, app):
        userinfo = self.request.get('owner')
        project = self.request.get('project')
        page = self.request.get('page')
        item = self.request.get('item')
        attribute = self.request.get('attribute')
        tags = self.request.get_all('tags[]')
        datetime1 = self.request.get('datetime1')
        datetime2 = self.request.get('datetime2')
        #
        taskqueue.add(url='/tasks/'+app+'/delete_elements', params={
                'userinfo': userinfo,
                'project': project,
                'page': page,
                'item': item,
                'attribute': attribute,
                'tags': tags,
                'datetime1': datetime1,
                'datetime2': datetime2
                })
        #
        ret = {}
        bulbware_lib.write_json(self, ret);

class appendFileToElement(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('element_id')
        file = self.request.get('file') 
        #
        element = bulbware_model.get_element(app, key)
        if element:
            if element.check_edit(userinfo):
                # ファイルをblobstoreに保存
                pic = bulbware_lib.resize_image(file, 800, 800)
                blob_key = bulbware_lib.set_blob(pic, 'image/jpeg')
                # blob_keyをリンクに保存
                data = element.get_option_values()
                if 'image' in data:
                    blobstore.delete(data['image'])
                data['image'] = str(blob_key)
                element.options = json.dumps(data, ensure_ascii=False)
                element.put()
                #
                ret = {
                    'blob_key': str(blob_key)
                    }
                bulbware_lib.write_json(self, ret);

app = webapp2.WSGIApplication([
    ('/api/(.*)/search_projects', searchProjects),
    ('/api/(.*)/get_project', getProject),
    ('/api/(.*)/update_project', updateProject),
    ('/api/(.*)/delete_project', deleteProject),
    ('/api/(.*)/append_file_to_project', appendFileToProject),
    ('/api/(.*)/search_pages', searchPages),
    ('/api/(.*)/get_page', getPage),
    ('/api/(.*)/update_page', updatePage),
    ('/api/(.*)/delete_page', deletePage),
    ('/api/(.*)/append_file_to_page', appendFileToPage),
    ('/api/(.*)/search_items', searchItems),
    ('/api/(.*)/get_item', getItem),
    ('/api/(.*)/update_item', updateItem),
    ('/api/(.*)/delete_item', deleteItem),
    ('/api/(.*)/append_file_to_item', appendFileToItem),
    ('/api/(.*)/search_attributes', searchAttributes),
    ('/api/(.*)/get_attribute', getAttribute),
    ('/api/(.*)/update_attribute', updateAttribute),
    ('/api/(.*)/delete_attribute', deleteAttribute),
    ('/api/(.*)/append_file_to_attribute', appendFileToAttribute),
    ('/api/(.*)/search_elements', searchElements),
    ('/api/(.*)/get_element', getElement),
    ('/api/(.*)/update_element', updateElement),
    ('/api/(.*)/delete_element', deleteElement),
    ('/api/(.*)/delete_elements', deleteElements),
    ('/api/(.*)/append_file_to_element', appendFileToElement)
], debug=True)
