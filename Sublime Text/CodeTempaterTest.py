import sublime, sublime_plugin, time

from xml.etree import ElementTree as ET
import urllib.parse
import urllib.request
import ntpath

URL = "http://codetemplatertest-env.9ntrq9bsch.us-west-2.elasticbeanstalk.com/test"
TEMP_FILENAME = "TEMP"
KEY = "TEMP000000"
last_time = 0
period_sec = 0.7
INSTRUCTION_FILE_NAME = "instructions.txt"
TEMPLATE_FILE_NAME = "template.txt"

def path_leaf(path):
    head, tail = ntpath.split(path)
    return tail or ntpath.basename(head)

def callback_do_lambda(x):
	return lambda: callback_do(x)




def callback_do(time_it_hit):
	global last_time

	instructions = ""
	template = ""
	
	if time_it_hit == last_time:
		
		wins = sublime.windows()
		new_view = None

		for win in wins:
			for view in win.views():
				if view.file_name() is not None and path_leaf(view.file_name()) == TEMPLATE_FILE_NAME:
					template = view.substr( sublime.Region(0,999999999) )

				if view.file_name() is not None and path_leaf(view.file_name()) == INSTRUCTION_FILE_NAME:
					instructions = view.substr( sublime.Region(0,999999999) )

				if view.settings().get("key") == KEY:
					new_view = view

		if new_view is None:   
			new_view = sublime.active_window().new_file()
			new_view.set_name(TEMP_FILENAME)
			new_view.settings().set("key", KEY)
		
		
		"""
		with urllib.request.urlopen(REQUEST) as response:
			result = response.read()
			print(result) 
		"""

		
		values = {"instructions": instructions, "template": template} 

		data = urllib.parse.urlencode(values) 
		data = data.encode('ascii') # data should be bytes
		req = urllib.request.Request(URL, data)
		with urllib.request.urlopen(req) as response:
			result = response.read()
			new_view.run_command("do", {"text": result.decode("utf-8")})
			#print(result.decode("utf-8"))
		

		#print("WORKS") 
		



class Thing(sublime_plugin.ViewEventListener):  
	def on_modified(self):
		global last_time
		global period_sec 

		if self.view.file_name() is not None and (path_leaf(self.view.file_name()) == INSTRUCTION_FILE_NAME or path_leaf(self.view.file_name()) == TEMPLATE_FILE_NAME):
			last_time = int(round(time.time() * 1000))
			#content = self.view.substr( sublime.Region(0,999999999) )
			sublime.set_timeout_async(callback_do_lambda(last_time), period_sec*1000) 


class DoCommand(sublime_plugin.TextCommand):
    def run(self, edit, text):
        #print( self.view.symbols() )
        self.view.erase(edit, sublime.Region(0,999999999))
        self.view.insert(edit, 0, text) 
