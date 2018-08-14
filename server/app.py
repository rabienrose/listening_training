import requests
import os
from flask import Flask
from flask import request
from bs4 import BeautifulSoup
from urllib.request import urlopen
import sqlite3
import random
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
    #print(article_json)
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
    for p in all_p:
        p_str=p.text
        sents=p_str.split('[,.]')
        for sent in sents:
            words=sent.split(' ')
            if len(words)<=10:
                continue
            candi_word=[]
            for word in words:
                if len(word)>=5:
                    candi_word.append(word)
            if len(candi_word)<=0:
                continue
            choosed_id=random.randint(0,len(candi_word)-1)
            choosed_word.append(candi_word[choosed_id])
    keywords = []
    for i in range(len(choosed_word)):
        keywords.append(choosed_word[i])
        first_fake=''
        second_fake = ''
        while True:
            choosed_id = random.randint(0, len(choosed_word) - 1)
            if choosed_word[choosed_id]!= choosed_word[i] and choosed_word[choosed_id] != first_fake and choosed_word[choosed_id] != second_fake:
                if first_fake== "":
                    first_fake=choosed_word[choosed_id]
                else:
                    second_fake=choosed_word[choosed_id]
                    break
        keywords.append(first_fake)
        keywords.append(second_fake)
    write_a_article(title, aud_src, '', keywords)

@app.route('/article_list', methods=['GET', 'POST'])
def get_article_list():
    return get_a_article(3)

@app.route('/login', methods=['GET', 'POST'])
def get_user_info():
    #requests.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+appid+'&secret='+secret)
    rec_data = request.values.get('code')
    appid='wx7fe6882cde4dece0'
    secret='d118e90b11fbc2aeb2e8f6c896dd429d'
    js_code=rec_data
    r = requests.get(
        'https://api.weixin.qq.com/sns/jscode2session?&appid='+appid+'&secret='+secret+'&js_code='+js_code+'&grant_type=authorization_code')
    re_obj=json.loads(r.text)
    return re_obj['openid']

def check_add_user(openid, name, img_src):
    c = conn.cursor()
    c.execute('select * from user where openid=?', [openid])
    records = c.fetchall()
    if len(records) == 0:
        c.execute("insert into user (name, openid, img_src, score) VALUES (?,?,?,?)",
                  [name, openid, img_src, '{}'])
        conn.commit()

def update_score(openid, score, article_id):
    c = conn.cursor()
    c.execute('select * from user where openid=?', [openid])
    records = c.fetchall()
    for (_,_,_,_,score_json, _) in records:
        score_objs=json.loads(score_json)
        if article_id in score_objs.keys():
            if score_objs[article_id]<score:
                score_objs[article_id]=score
        else:
            score_objs[article_id]=score
        t_score=0
        for s in score_objs.values():
            t_score=t_score+int(s)
        score_str=json.dumps(score_objs)
        c.execute("update user set score=?, total_s=? where openid=?", [score_str, t_score,openid])
        conn.commit()

@app.route('/update', methods=['GET', 'POST'])
def update_score_handle():
    openid = request.values.get('openid')
    score = request.values.get('score')
    article_id = request.values.get('article_id')
    name = request.values.get('name')
    img_src = request.values.get('img_src')
    print(openid)
    check_add_user(openid, name, img_src)
    update_score(openid, score, article_id)
    return ''

@app.route('/get_rank', methods=['GET', 'POST'])
def get_rank():
    c = conn.cursor()
    c.execute('select * from user order by total_s desc LIMIT 10')
    records = c.fetchall()
    re_list=[]
    for (_, name, openid, img_src, score, total_s) in records:
        re_dict={}
        re_dict['name']=name
        re_dict['img_src'] = img_src
        re_dict['score'] = total_s
        re_list.append(re_dict)
    return json.dumps(re_list)

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
    conn=sqlite3.connect('test.db')
    port = int(os.environ.get('PORT', '8000'))
    app.run('0.0.0.0', port=8000, ssl_context=(
        '/home/chamo/Documents/data/weixin.zili-wang.com/Apache/2_weixin.zili-wang.com.crt',
        '/home/chamo/Documents/data/weixin.zili-wang.com/Apache/3_weixin.zili-wang.com.key'))
