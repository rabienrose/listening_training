import requests
import os
from flask import Flask
from flask import request
from bs4 import BeautifulSoup
from urllib.request import urlopen
import sqlite3
import black_list
import random
import re
import json

app = Flask(__name__)


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
        item_dict['keywords']=item[1]
        item_dict['title']=item[2]
        item_dict['mp3'] = item[3]
        article_list.append(item_dict)
    article_json=json.dumps(article_list)
    #print("[/get_a_article]article_json: " + article_json)
    return article_json

def write_a_article(title, aud_src, content, keywords):
    keyword_str = ','.join(keywords)
    c = conn.cursor()
    c.execute("INSERT INTO article (title, aud_src, content, keyword) VALUES (?,?,?,?)",[title, aud_src, content, keyword_str])
    conn.commit()
    return

def save_a_article(html_addr):
    html = urlopen(html_addr)
    soup = BeautifulSoup(html, features='lxml')
    title = soup.find_all(id='title')[0].text
    aud_src = soup.find_all(id='mp3')[0].attrs['href']
    content_h = soup.find_all(id='content')[0]
    all_p=content_h.find_all('p')
    choosed_word=[]
    filtered_words=[]
    for p in all_p:
        p_str=p.text
        words=re.split("[,. '“”]",p_str)
        for word in words:
            if len(word)<=4:
                continue
            if word.isupper():
                continue
            if not word.isalpha():
                continue
            word = word.lower()
            if word in black_list.black_list:
                continue
            filtered_words.append(word)
    write_a_article(title, aud_src, '', filtered_words)

@app.route('/article_list', methods=['GET', 'POST'])
def get_article_list():
    return get_a_article(10)

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
    #get_article_list_web()
    port = int(os.environ.get('PORT', '21070'))
    app.run('0.0.0.0', port=21070, ssl_context=(
        './2_weixin.zili-wang.com.crt',
        './3_weixin.zili-wang.com.key'))
