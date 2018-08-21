import requests
import os
from flask import Flask
from flask import render_template
from flask import request
from flask_wtf import FlaskForm
from werkzeug.datastructures import CombinedMultiDict
from wtforms import Form
from flask import redirect
from wtforms.widgets import TextArea
from wtforms import StringField, SubmitField, IntegerField, FileField
from bs4 import BeautifulSoup
from urllib.request import urlopen
import sqlite3
import black_list
import random
import re
import json
import operator

app = Flask(__name__)

class ArticleForm(Form):
    title= StringField('Title')
    content = StringField('Content', widget=TextArea())
    level = IntegerField('Level')
    mp3 = StringField('Mp3')
    mp3_file= FileField('Mp3 File')
    id = IntegerField('ID')
    submit=SubmitField('Submit')

@app.route('/try', methods=['GET', 'POST'])
def handle_api_evaluation():
    return 'chamo'


@app.route('/upload', methods=['POST'])
def handle_upload():
    imgs = request.files.getlist('file')
    for img in imgs:
        img.save('./' + img.filename)
    return 'chamo'

def get_a_article(index):
    c = conn.cursor()
    c.execute('select * from article order by id LIMIT ?', [index])
    records=c.fetchall()
    article_list=[]
    for item in records:
        item_dict = {}
        item_dict['id']=item[0]
        item_dict['title']=item[2]
        item_dict['mp3'] = item[3]
        item_dict['level'] = item[5]
        c.execute('select * from user')
        records = c.fetchall()
        all_score={}
        for (_, name, _, _, score, _, _) in records:
            score_obj = json.loads(score)
            if str(item_dict['id']) in score_obj.keys():
                all_score[name]=int(score_obj[str(item_dict['id'])])
        sorted_all=sorted(all_score.items(),key=operator.itemgetter(1), reverse=True)
        sorted_name=[]
        sorted_score = []
        temp_count=0
        for (name, score) in sorted_all:

            sorted_name.append(name)
            sorted_score.append(score)
            temp_count = temp_count + 1
            if temp_count >=3:
                break

        item_dict['sorted_name'] = sorted_name
        item_dict['sorted_score'] = sorted_score
        article_list.append(item_dict)
    article_json=json.dumps(article_list)
    #print("[/get_a_article]article_json: " + article_json)
    return article_json

def write_a_article(title, aud_src, content, keywords, level):
    keyword_str = ','.join(keywords)
    c = conn.cursor()
    c.execute("INSERT INTO article (title, aud_src, content, keyword, level) VALUES (?,?,?,?,?)",
              [title, aud_src, content, keyword_str, level])
    conn.commit()
    return

def process_keywords(content):
    filtered_words=[]
    words = re.split("[^a-zA-Z]", content)
    for word in words:
        if len(word) <= 3:
            continue
        if word.isupper():
            continue
        if not word.isalpha():
            continue
        word = word.lower()
        if word in black_list.black_list:
            continue
        filtered_words.append(word)
    single_list=[]
    for item in filtered_words:
        if filtered_words.count(item)==1:
            single_list.append(item)
    return single_list

def save_a_article(html_addr):
    html = urlopen(html_addr)
    soup = BeautifulSoup(html, features='lxml')
    title = soup.find_all(id='title')[0].text
    aud_src = soup.find_all(id='mp3')[0].attrs['href']
    content_h = soup.find_all(id='content')[0]
    all_p=content_h.find_all('p')
    content=''
    for p in all_p:
        content=content+p.text
    filtered_words=process_keywords(content)
    write_a_article(title, aud_src, '', filtered_words)

@app.route('/article_list', methods=['GET', 'POST'])
def get_article_list():
    return get_a_article(100)

@app.route('/article_content', methods=['GET', 'POST'])
def get_article_content():
    article_id = request.values.get('article_id')
    c = conn.cursor()
    c.execute('select * from article where id= ?', [article_id])
    records = c.fetchall()
    for item in records:
        content=item[4]
    return content

@app.route('/article_keyword', methods=['GET', 'POST'])
def get_article_keyword():
    article_id = request.values.get('article_id')
    c = conn.cursor()
    c.execute('select * from article where id= ?', [article_id])
    records = c.fetchall()
    for item in records:
        keywords=item[1]
        step_rate=float(len(keywords))/float(len(item[4]))
    re={}
    re['keywords']=keywords
    re['step_rate']=step_rate
    print("[/article_keyword]step_rate: " + str(step_rate))
    return json.dumps(re)

@app.route('/login', methods=['GET', 'POST'])
def get_user_info():
    #requests.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+appid+'&secret='+secret)
    rec_data = request.values.get('code')
    appid='wx7fe6882cde4dece0'
    secret='d118e90b11fbc2aeb2e8f6c896dd429d'
    js_code=rec_data
    print("[/login]js_code: " + js_code)
    r = requests.get(
        'https://api.weixin.qq.com/sns/jscode2session?&appid='+appid+'&secret='+secret+'&js_code='+js_code+'&grant_type=authorization_code')
    re_obj=json.loads(r.text)
    print("[/login]openid: " + re_obj['openid'])
    return re_obj['openid']

def check_add_user(openid, name, img_src):
    c = conn.cursor()
    c.execute('select * from user where openid=?', [openid])
    records = c.fetchall()
    if len(records) == 0:
        c.execute("insert into user (name, openid, img_src) VALUES (?,?,?)",
                  [name, openid, img_src])
        conn.commit()

def update_score(openid, score, article_id):
    c = conn.cursor()
    c.execute('select * from user where openid=?', [openid])
    records = c.fetchall()
    print("[update_score]score: " + score)
    for (_,_,_,_,score_json, _, _) in records:
        score_objs=json.loads(score_json)
        if article_id in score_objs.keys():
            if int(score_objs[article_id])<int(score):
                score_objs[article_id]=score
        else:
            score_objs[article_id]=score
        t_score=0
        for s in score_objs.values():
            t_score=t_score+int(s)
        score_str=json.dumps(score_objs)
        print("[update_score]score_str: "+score_str)
        print("[update_score]t_score: " + str(t_score))
        c.execute("update user set score=?, total_s=? where openid=?", [score_str, t_score,openid])
        conn.commit()

@app.route('/update', methods=['GET', 'POST'])
def update_score_handle():
    openid = request.values.get('openid')
    score = request.values.get('score')
    article_id = request.values.get('article_id')
    name = request.values.get('name')
    img_src = request.values.get('img_src')
    print('[/update] openid: '+openid)
    print('[/update] article_id: ' + article_id)
    print('[/update] score: ' + score)
    check_add_user(openid, name, img_src)
    update_score(openid, score, article_id)
    return ''


@app.route('/get_user_scores', methods=['GET', 'POST'])
def get_user_scores():
    #openid = request.json.get('openid', '')
    openid = request.values.get('openid')
    print('[/get_user_scores] openid: ' + openid)
    c = conn.cursor()
    c.execute('select * from user where openid=?', [openid])
    records = c.fetchall()
    re='{}'
    for (_, _, _, _, score, _,_) in records:
        re=score
    print('[/get_user_scores] re: '+re)
    return re

@app.route('/get_rank', methods=['GET', 'POST'])
def get_rank():
    c = conn.cursor()
    c.execute('select * from user order by total_s desc LIMIT 10')
    records = c.fetchall()
    re_list=[]
    for (_, name, openid, img_src, score, total_s,_) in records:
        re_dict={}
        re_dict['name']=name
        re_dict['img_src'] = img_src
        re_dict['score'] = total_s
        re_list.append(re_dict)
    re_list_json=json.dumps(re_list)
    print('[/get_rank] re_list: ')
    print(re_list_json)
    return re_list_json

def modify_article(id, title, mp3, content, level):
    c = conn.cursor()
    if content:
        keywords = process_keywords(content)
        keyword_str = ','.join(keywords)
        c.execute("update article set content=?, keyword=? where id=?", [content, keyword_str, id])
        conn.commit()
    if title:
        c.execute("update article set title=? where id=?", [title, id])
        conn.commit()
    if mp3:
        c.execute("update article set aud_src=? where id=?", [mp3, id])
        conn.commit()
    if level:
        c.execute("update article set level=? where id=?", [level, id])
        conn.commit()
    return

def del_article(id):
    c = conn.cursor()
    c.execute("delete from article where id=?", [id])
    return

@app.route('/server_article_detail', methods=['GET'])
def server_article_detail():
    article_id = request.values.get('article_id')
    c = conn.cursor()
    c.execute('select * from article where id= ?', [article_id])
    records = c.fetchall()
    for item in records:
        record=item
    key_str=record[1].replace(',', ' ')
    content_str= record[4].split('\n')
    ret_re={}
    ret_re['content']=content_str
    ret_re['title'] = record[2]
    ret_re['keywords'] = key_str
    return render_template('article_detail.html', result=ret_re)

@app.route('/server_ui', methods=['GET', 'POST'])
def server_ui():
    c = conn.cursor()
    c.execute('select * from article order by id LIMIT ?', [100])
    records = c.fetchall()
    form=ArticleForm(request.form)
    return render_template('upload.html', form=form, result=records)

@app.route('/add_article_ui', methods=['GET', 'POST'])
def add_article_ui():
    form = ArticleForm(CombinedMultiDict((request.files, request.form)))
    title= form.title.data
    mp3 = form.mp3.data
    level = form.level.data
    content = form.content.data
    id = form.id.data
    if form.mp3_file.data:
        form.mp3_file.data.save('/var/www/html/'+form.mp3_file.data.filename)
        mp3='http://weixin.zili-wang.com/'+form.mp3_file.data.filename
    if not id: #add new record
        keywords = process_keywords(content)
        if title == '' or mp3 == '' or not level or content == '':
            return "all fields are needed when adding new article"
        if level>5 or level<=0:
            return 'level must be in the range of 1-5'
        write_a_article(title, mp3, content, keywords, level)
    else:
        if title!='' or mp3!='' or level or content!='': #modify
            modify_article(id, title, mp3, content, level)
        else: #del
            del_article(id)
    return redirect('/server_ui')

def get_article_list_web():
    root_51voa='http://www.51voa.com'
    article_51voa=root_51voa+'/VOA_Standard_1.html'
    html = urlopen(article_51voa)
    soup = BeautifulSoup(html, features='lxml')
    content_h = soup.find_all(id='list')
    all_a = content_h[0].find_all('a')
    for a in all_a:
        save_a_article(root_51voa+a.attrs['href'])

if __name__ == '__main__':
    conn=sqlite3.connect('test.db',check_same_thread=False)
    app.config['SECRET_KEY'] = 'xxx'
    app.config['UPLOAD_FOLDER']='./'
    #app.run('0.0.0.0', port=21070)
    app.run('0.0.0.0', port=21070, ssl_context=('./1_weixin.zili-wang.com_bundle.crt','./2_weixin.zili-wang.com.key'))
