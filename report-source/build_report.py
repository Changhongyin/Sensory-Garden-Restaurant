"""Final Chinese submission report; all figures are real project inputs or saved renders."""
from pathlib import Path
import json,io,math
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor,Color,white
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
R=Path(__file__).resolve().parent;A=R/'assets';META=R.parent/'metadata'
OUT=Path(__import__('sys').argv[1]) if len(__import__('sys').argv)>1 else R/'项目报告书.pdf'
pdfmetrics.registerFont(TTFont('Heiti','/System/Library/Fonts/STHeiti Light.ttc',subfontIndex=0));pdfmetrics.registerFont(TTFont('HeitiM','/System/Library/Fonts/STHeiti Medium.ttc',subfontIndex=0))
W,H=595.276,841.89;GREEN=HexColor('#203d32');GOLD=HexColor('#a68143');INK=HexColor('#2e3731');MUTED=HexColor('#6f776e');BG=HexColor('#fbfaf6');LINE=HexColor('#dddccf')
TOTAL=11;c=canvas.Canvas(str(OUT),pagesize=(W,H));c.setTitle('栖光之间：自然共生的流动园境 - 项目报告书');c.setAuthor('栖光之间项目组');c.setSubject('最终黄昏建筑景观、4K/60fps Demo 与实时网页交付')
style=ParagraphStyle('body',fontName='Heiti',fontSize=10.4,leading=17,textColor=INK,wordWrap='CJK',spaceAfter=5)
checks=[]
def p(txt,x,y,w=515,size=10.4,color=INK,leading=None,maxh=None):
 st=ParagraphStyle('x',parent=style,fontSize=size,leading=leading or size*1.65,textColor=color);o=Paragraph(txt,st);_,h=o.wrap(w,1000)
 if maxh is not None:assert h<=maxh,(txt[:30],h,maxh)
 assert y-h>42,(txt[:30],y,h);o.drawOn(c,x,y-h);checks.append({'page':page,'text':txt[:24],'bottom':y-h,'right':x+w});return y-h

def label(txt,x,y,size=10,color=GOLD):c.setFillColor(color);c.setFont('HeitiM',size);c.drawString(x,y,txt)
def title(txt,sub):
 c.setFillColor(BG);c.rect(0,0,W,H,fill=1,stroke=0);label('栖光之间  /  FINAL PROJECT REPORT',40,H-35,8,MUTED);label(f'{page:02d}',W-66,H-35,10,GOLD)
 label(txt,40,H-86,26,GREEN);p(sub,40,H-105,515,9.2,MUTED,maxh=38)
 c.setStrokeColor(LINE);c.line(40,46,W-40,46);label('C07r12 · C09  |  2026.11.11',40,29,8,MUTED);label(f'{page} / {TOTAL}',W-77,29,8,MUTED)
def section(txt,y):label(txt,40,y,13,GREEN);return y-15
cache={}
def fig(name,x,y,w,h,caption=None):
 fp=A/name;assert fp.exists(),fp
 if fp not in cache:
  im=Image.open(fp).convert('RGB');im.thumbnail((2400,2800),Image.Resampling.LANCZOS);b=io.BytesIO();im.save(b,'JPEG',quality=94,optimize=True);cache[fp]=(ImageReader(io.BytesIO(b.getvalue())),im.size)
 ir,(iw,ih)=cache[fp];s=min(w/iw,h/ih);dw,dh=iw*s,ih*s;c.setFillColor(white);c.roundRect(x,y,w,h,6,fill=1,stroke=0);c.drawImage(ir,x+(w-dw)/2,y+(h-dh)/2,width=dw,height=dh,mask='auto')
 if caption:p(caption,x,y-7,w,8.2,MUTED,leading=12,maxh=40)
def table(rows,x,y,widths,rowh=30):
 data=[[Paragraph(str(v),ParagraphStyle('cell',parent=style,fontSize=9.1,leading=14)) for v in row] for row in rows]
 t=Table(data,colWidths=widths,rowHeights=None);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),HexColor('#eeeadd')),('GRID',(0,0),(-1,-1),.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]));tw,th=t.wrap(sum(widths),1000);assert y-th>50,(page,th);t.drawOn(c,x,y-th);return y-th

topic=json.loads((META/'topic.json').read_text());perf=json.loads((META/'mac-live-performance.json').read_text());video=json.loads((META/'demo-export.json').read_text());scene=json.loads((R.parent/'render/scene-provenance.json').read_text());final_info=json.loads((META/'native-final-render.json').read_text()) if (META/'native-final-render.json').exists() else None
hero='hero_final.png'
# 1 - Cover
page=1;title('栖光之间','自然共生的流动园境  /  建筑、景观与镜头展示')
fig(hero,40,118,515,566)
label('PROJECT CLOSEOUT  /  FINAL DELIVERY',40,89,10,GOLD);p('黄昏场景 · 真实三维 Demo · 高清渲染工程',40,73,515,10.5,GREEN,maxh=20);c.showPage()
# 2 - Overview and topic
page=2;title('项目概述','从单体建筑展示，回到人与自然共享的空间体验。')
y=section('选题名称',675);y=p(topic['name'],40,y,515,17,GREEN,maxh=58)
y=section('选题简介',y-33);y=p(topic['introduction'],40,y,515,12,INK,maxh=100)
y=section('本次交付范围',y-38);y=p('以既定有机建筑及完整园林为主体，完成黄昏场景、镜头叙事、全场实时网页及高清再渲染工程。保留透光膜屋顶、全高透明玻璃、浅色陶瓷花池及温暖木平台；最终作品不包含人物、游戏或后续新增建筑。',40,y,515,11,maxh=105)
for i,(n,t) in enumerate([('25','桌位组'),('70','座席'),('4K / 60','视频输出')]):
 x=40+i*174;c.setFillColor(HexColor('#eeeedd'));c.roundRect(x,230,163,110,8,fill=1,stroke=0);label(n,x+15,289,25,GREEN);label(t,x+15,258,10,MUTED)
p('服务对象：空间设计爱好者、建筑与景观展示观众，以及需要直观理解空间层次的评审。作品以环境、材质与镜头组织为重点，餐桌作为尺度和使用场景的组成。',40,190,515,10.5,maxh=100);c.showPage()
# 3 - References
page=3;title('设计依据与风格','用户提供的概念、平面及效果图构成设计输入；本页参考图用于说明设计方向。')
fig('reference_concept.jpeg',40,315,249,355,'概念参考：连续曲线、轻盈覆盖与中央绿地。')
fig('reference_plan.jpeg',306,315,249,355,'工程表达参考：膜面、柱网、围合与家具关系。')
y=section('保留的设计语言',255);y=p('建筑以流动曲线串联两端空间，木平台作为连续的步行与停留界面；膜屋顶以波峰、低谷、张拉边界形成轻盈的轮廓。绿地、树冠与远景共同构成建筑的背景，而不是孤立的装饰。',40,y,515,10.5,maxh=92)
y=p('经确认的优化：围墙由旧参考中的锈蚀外观调整为浅色陶瓷；增加透明落地玻璃；初次展示排除人物；远处房屋移除，改用河流及绿色生态背景。参考图用于视觉设计和空间推演，不作为施工文件。',40,y-19,515,10.1,maxh=98);c.showPage()
# 4 - Site
page=4;title('完整园境与空间层次','将建筑放回草地、坡体、树木、草甸及水岸共同构成的场景中。')
fig('demo_landscape.png',40,390,515,290,'最终实时场景的原生 4K 输出帧；远景林带、河流与低山包含在三维场景中。')
y=section('由近及远的生态组织',337)
for i,(h,b) in enumerate([('01 近景界面','木平台、细草、灌木与浅色陶瓷花池，为镜头提供可感知的尺度。'),('02 中景地形','立体草坡、坡顶树木、后方小路及相连灌木带共同形成围合。'),('03 远景背景','以草甸、成组林带、河流和低矮山体延伸空间，不使用远处房屋。')]):
 label(h,40,y-3,11,GREEN);y=p(b,40,y-16,515,10.2,maxh=48)-19
p('自然草地的细节随观看距离分配：近处保留草叶与植栽形态，远处强调密度、颜色层次、轮廓和整体纵深。镜头应看到建筑与环境之间的连接。',40,139,515,10.2,maxh=75);c.showPage()
# 5 - Architecture
page=5;title('建筑构造与透光表达','以可编辑的结构、覆盖及围合对象组织建筑细节。')
fig('roof.png',40,467,249,185,'膜面、接缝与张拉支承的离线细节。')
fig('glass.png',306,467,249,185,'玻璃围合及远侧空间的离线检查。')
fig('crossing.png',40,225,249,185,'宽带与交叉区域的连接细部。')
fig('backlit.png',306,225,249,185,'标注的背光诊断视角，用于检验膜面透光。')
p('轻盈的膜屋顶与较稳定的曲面宽带共同塑造轮廓；支撑、接缝、排水及玻璃边界保持明确。浅色陶瓷花池与绿植形成洁净、温和的界面。图中诊断视角用于说明材料与构造，不作为主宣传机位。',40,155,515,10.3,maxh=91);c.showPage()
# 6 - Furniture
page=6;title('小资产与近景质量','桌位既提供生活尺度，也承担镜头进入室内后的细节展示。')
fig('cutlery.png',40,352,515,324,'同源餐具资产的离线细节检查图，来自修正阶段保存的实际渲染。')
fig('chair.png',40,115,249,180,'座椅的多方向检查资料。')
p('保留 25 组桌位与 70 个座位。桌面陈设包含盘碟、刀叉、匙、玻璃器皿、花器及小型装饰；资产保持分别组织，避免仅在远景中依靠整体轮廓。',306,295,249,10.5,maxh=112)
p('近景镜头需覆盖完整桌面，展示物件之间的比例、摆放和材质。最终 Demo 使用独立细部机位，完整呈现桌面陈设，同时保持主体和空间关系可读。',306,170,249,10.2,maxh=100);c.showPage()
# 7 - Iteration evidence
page=7;title('过程与关键修正','以下为真实工程过程中保存的对比资料：左为修正前，右为修正后。')
fig('iteration_roof.png',40,465,515,203,'膜面及相关界面修正前后对比。')
fig('iteration_cutlery.png',40,242,515,176,'餐具布置及局部细节检查对比。')
fig('iteration_turf.png',40,86,515,114,'草坪覆盖缺口修正对比。')
c.showPage()
# 8 - Toolchain
page=8;title('工具分工与实现方法','准确说明工具作用，主体设计与工程整合由独立的建模和渲染流程完成。')
y=table([['环节','工具 / 方法','本项目实际作用'],['部分资产生产','Aholo Lux3D','提供软包座椅、蕨类及垂吊常春藤的初始资产，用于后续精修和场景整合。'],['主体与资产整合','Blender 5.2.3 LTS / Python','有机建筑、桌位、膜面、玻璃与园境的工程组织、检查和精修。'],['离线效果图','Cycles / AgX','处理间接光、膜面、玻璃与材质；保留可再渲染工程。'],['交互网页','Three.js / GLB / 实例化','整场旋转、缩放、机位切换、可中断漫游和分层资产加载。'],['高清 Demo','逐帧 WebGL / WebCodecs / FFmpeg','按固定时间步生成真实 3D 帧，再封装为 4K / 60fps 视频。']],40,675,[95,143,277])
y=section('从细模到可运行产品',y-37);p('离线工程保留完整可编辑资产与材质。网页衍生资产使用共享几何、植栽实例、距离裁切和近远层次，避免把大量重复树木及家具展开为独立几何。原始灯光与材质记录仍保存在渲染工程中。',40,y,515,10.5,maxh=102)
p('素材来源：部分植被、石材和天空输入来自 Poly Haven；座椅及部分植栽源资产来自本项目 Aholo Lux3D 流程。网页使用 three.js，随包保留其许可文本。完整来源及验证资料收录在源代码包 metadata 中。',40,181,515,10.2,maxh=100);c.showPage()
# 9 - Demo
page=9;title('镜头叙事与最终 Demo','40 秒、2400 个实际渲染帧，以抵达、观察和离开的顺序展现空间。')
for n,x,y,cap in [('demo_overview.png',40,511,'建筑全景'),('demo_landscape.png',306,511,'远景生态'),('demo_courtyard.png',40,329,'庭院界面'),('demo_detail.png',306,329,'餐具与近景')]:fig(n,x,y,249,140,cap+' · 原生 4K 输出帧')
table([['时间','镜头内容','目的'],['00-07 秒','沿入口接近','建立建筑与到达路径的关系'],['07-16 秒','全景缓慢移动','交代曲面轮廓与完整平面'],['16-23 秒','园境远眺','展示林带、河流与低山层次'],['23-30 秒','庭院停留','理解内外空间及围合'],['30-36 秒','桌面细部','检验家具、餐具与尺度'],['36-40 秒','退回全景','以完整场景结束展示']],40,266,[85,137,293]);c.showPage()
# 10 - Quality and measurement
page=10;title('验证结果与性能边界','输出视频规格与实时运行性能分别记录，避免混淆。')
table([['项目','实测 / 验证结果'],['离线场景版本','C07r12，25 桌 / 70 席；可移植工程无外部链接库，文件图像已打包。'],['GLB 往返检查','建筑、植栽、远地形与近景树库均重新导入；没有无效位置或缺失图像。'],['整场场景覆盖','6887 个植栽放置 + 2889 个树木放置，包含完整建筑、道路与远景。'],['Mac 网页实测','1579×810、DPR 1；平均约 55.2fps；P95 33.3ms；1% low 约 29.2fps。'],['Demo 视频','3840×2160，60/1 fps，2400 帧，40.000 秒，H.264；逐帧输出，无补帧。'],['源工程复现检查','已用打包后的独立工程完成 2160×2700、256 samples 渲染；PNG 和线性 EXR 均保留。']],40,675,[129,386])
y=section('如实保留的技术边界',325);y=p('实时玻璃、薄膜及间接光使用适合网页的近似，视觉不等同于 Cycles 离线结果。远树采用原树渲染的图卡；两类小树在很近处切换实体 LOD。网页适合完整建筑与受控近景观看，不把远景图卡作为超近景主角。',40,y,515,10.5,maxh=112)
y=p('60fps 是导出视频的固定帧率，不意味着所有设备都能实时维持 60fps。上述网页结果来自本机单次完整场景测试；更高画质、屏幕分辨率及其他设备会影响实际性能。',40,y-18,515,10.4,maxh=85)
if final_info:p('本次新增高清离线图：'+str(final_info['width'])+'×'+str(final_info['height'])+'，'+str(final_info['samples'])+' samples，Cycles '+('Metal GPU' if final_info.get('backend')=='METAL' else 'CPU '+str(final_info['threads'])+' 线程')+'。运行清单与线性 EXR 随交付保留。',40,119,515,9.7,maxh=60)
c.showPage()
# 11 - Delivery
page=11;title('交付与参赛材料对应','最终交付只保留可体验、可说明、可复现本作品的必要内容。')
table([['交付内容','用途'],['01_Demo','4K / 60fps MP4 可直接上传；网页体验包含本地启动脚本及完整资源。'],['02_项目报告书.pdf','设计理念、工具作用、过程截图、关键迭代、最终效果及验证边界。'],['03_完整代码与高清渲染工程.zip','可移植 Blender 工程、独立渲染脚本、网页源码、资源、来源和校验清单。'],['04_高清效果图','离线原生效果图与真实三维 4K 帧；原生分辨率与来源分别注明。'],['选题与提交说明.txt','选题名称、85 字简介、赛道建议及表单项目对应。']],40,675,[155,360])
y=section('体验与重新渲染',y if False else 385)
y=p('网页：打开 01_Demo/网页体验，运行启动脚本后访问本机地址。支持拖动、缩放、全景 / 远眺 / 庭院 / 细部、可中断漫游与原图切换。静止时停止重复绘制。',40,y,515,10.4,maxh=90)
y=p('源工程：解压代码包，使用 Blender 5.2.3 LTS 运行 render/render_final.py。提供 original、final、ultra 和 verify 配置；某配置是否已实测，以它自己的输出和运行清单为准。',40,y-17,515,10.4,maxh=90)
y=p('参赛：建议选择“空间设计应用类”，也可按本次镜头视频选择“影视应用类”。生态设备/技术按真实使用填写；未使用则选“无”。本机 localhost 不是公开参赛链接；视频文件可直接上传。',40,y-17,515,10.2,maxh=90)
p('本报告依据用户提供的设计参考、实际工程文件及已保存的渲染 / 导出结果编写。参考图展示设计意图，最终交付以所附场景和视频为准。未代为勾选条款或提交赛事。',40,119,515,9.7,MUTED,maxh=62);c.showPage()
c.save();(R/'layout-checks.json').write_text(json.dumps({'pages':TOTAL,'checks':checks},ensure_ascii=False,indent=2));print('CREATED',OUT,'PAGES',TOTAL)
