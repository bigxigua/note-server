USE note_db;
-- ----------------------------
-- Table structure for note_user_info
-- 用户信息表
-- ----------------------------
DROP TABLE IF EXISTS `note_db`.`note_user_info`;
CREATE TABLE `note_user_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键、自增',
  `account` varchar(20) DEFAULT '' COMMENT '登陆账号',
  `nickname` varchar(20) DEFAULT '' COMMENT '昵称',
  `password` varchar(20) NOT NULL COMMENT '密码',
  `uuid` varchar(200) NOT NULL COMMENT '用户uid',
  `user_login_version` varchar(200) NOT NULL COMMENT '用户登陆版本号',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for note_notebook
-- 用户笔记表
-- ----------------------------
DROP TABLE IF EXISTS `note_db`.`note_notebook`;
CREATE TABLE `note_notebook` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键、自增',
  `notebook_name` varchar(200) DEFAULT '' COMMENT '笔记本名称',
  `notebook_id` varchar(200) DEFAULT NULL COMMENT '笔记本id',
  `notebook_created_time` varchar(200) DEFAULT NULL COMMENT '笔记本创建时间',
  `user_id` varchar(200) NOT NULL COMMENT '用户id',
  `note_exist` int(11) NOT NULL COMMENT '笔记是否可用(没有被删除) 1是0否',
  `notebook_last_update` varchar(200) DEFAULT NULL COMMENT '最后一次更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8;


-- ----------------------------
-- Table structure for note_notebook
-- 用户子笔记表
-- ----------------------------
DROP TABLE IF EXISTS `note_db`.`note_subnote`;
CREATE TABLE `note_db`.`note_subnote` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(200) NOT NULL COMMENT '所属的用户的uuid',
  `sub_note_id` varchar(200) DEFAULT NULL COMMENT '子笔记id',
  `sub_note_created_time` varchar(200) DEFAULT NULL COMMENT '子笔记创建时间',
  `sub_note_exist` int(11) NOT NULL COMMENT '子笔记是否可用(没有被删除) 1是0否',
  `sub_note_markdown` longtext NOT NULL COMMENT '子笔记markdown文本',
  `sub_note_html` longtext NOT NULL COMMENT '子笔记html文本',
  `sub_note_title` varchar(200) NOT NULL COMMENT '笔记标题',
  `notebook_id` varchar(200) DEFAULT NULL COMMENT '所属笔记本的id',
  `sub_note_last_update` varchar(200) DEFAULT NULL COMMENT '0',
  `sub_note_name` varchar(200) DEFAULT NULL COMMENT '子笔记名称',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8;


