#!/usr/bin/env python
# -*- coding: utf-8 -*-

import webapp2
import logging

import user_model
import todo_model
import bulbware_lib

class searchProjects(webapp2.RequestHandler):
    def get(self, app):
        userinfo = user_model.get_login_userinfo()
        projects = todo_model.search_projects_owner(app, userinfo)
        #
        ret = [];
        for project in projects:
            ret.append(project.get_property())
        # プロジェクトがなく、create_nameが指定されている場合は、プロジェクトを生成する
        create_name = self.request.get('create_name')
        if (projects.count() == 0) and create_name:
            options = self.request.get('create_options')
            project = todo_model.add_project(app, userinfo, create_name, options)
            ret.append(project.get_property())
        #
        bulbware_lib.write_json(self, ret);

class getProject(webapp2.RequestHandler):
    def get(self, app):
        key = self.request.get('id')
        project = todo_model.get_project(app, key)
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
        project = todo_model.get_project(app, key)
        if project:
            if not project.save(userinfo, name, options):
                self.error(403)
        else:
            project = todo_model.add_project(app, userinfo, name, options)
        ret = {
            'object': project.get_property()
            }
        bulbware_lib.write_json(self, ret);

class deleteProject(webapp2.RequestHandler):
    def post(self, app):
        key = self.request.get('id')
        project = todo_model.get_project(app, key)
        if project:
            userinfo = user_model.get_login_userinfo()
            if project.check_delete(userinfo):
                project.key.delete();

class searchTasks(webapp2.RequestHandler):
    def get(self, app):
        userinfo = user_model.get_login_userinfo()
        project_key = self.request.get('project')
        project = todo_model.get_project(app, project_key);
        #
        tags = self.request.get_all('tags[]')
        #
        ret = [];
        if project.check_edit(userinfo):
            tasks = todo_model.search_tasks_owner(app, project, tags)
            for task in tasks:
                ret.append(task.get_property())
        bulbware_lib.write_json(self, ret);

class getTask(webapp2.RequestHandler):
    def get(self, app):
        key = self.request.get('id')
        task = todo_model.get_task(app, key)
        if task:
            if task.check_edit():
                ret = task.get_property()
                bulbware_lib.write_json(self, ret);

class updateTask(webapp2.RequestHandler):
    def post(self, app):
        userinfo = user_model.get_login_userinfo()
        key = self.request.get('id')
        name = self.request.get('name')
        options = self.request.get('options')
        start_datetime = self.request.get('start_datetime')
        due_datetime = self.request.get('due_datetime')
        completed = (self.request.get('completed') == 'true')
        tags = self.request.get_all('tags[]')
        #
        task = todo_model.get_task(app, key)
        if task:
            if not task.save(userinfo, name, options, start_datetime, due_datetime, completed, tags):
                self.error(403)
        else:
            project_key = self.request.get('project_id')
            project = todo_model.get_project(app, project_key)
            if project:
                if project.check_edit(userinfo):
                    task = todo_model.add_task(app, project, userinfo, name, options, start_datetime, due_datetime, completed, tags)
        if task:
            ret = {
                'object': task.get_property()
                }
        else:
            ret = {}
        bulbware_lib.write_json(self, ret);

class deleteTask(webapp2.RequestHandler):
    def post(self, app):
        key = self.request.get('id')
        task = todo_model.get_task(app, key)
        if task:
            userinfo = user_model.get_login_userinfo()
            if task.check_delete(userinfo):
                task.key.delete();

app = webapp2.WSGIApplication([
    ('/todo/api/(.*)/search_projects', searchProjects),
    ('/todo/api/(.*)/get_project', getProject),
    ('/todo/api/(.*)/update_project', updateProject),
    ('/todo/api/(.*)/delete_project', deleteProject),
    ('/todo/api/(.*)/search_tasks', searchTasks),
    ('/todo/api/(.*)/get_task', getTask),
    ('/todo/api/(.*)/update_task', updateTask),
    ('/todo/api/(.*)/delete_task', deleteTask)
], debug=True)
