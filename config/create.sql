
/*

 Source Server         : 45.76.98.174
 Source Server Type    : MySQL
 Source Server Version : 100213
 Source Host           : 45.76.98.174:3306

 Date: 15/05/2019 11:16:33
*/

-- ----------------------------
-- Table structure for note_user_info
-- 用户信息表
-- ----------------------------
DROP TABLE IF EXISTS `note_db`.`note_user_info`;
CREATE TABLE `note_db`.`note_user_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键、自增',
  `account` varchar(20) DEFAULT '' COMMENT '登陆账号',
  `nickname` varchar(20) DEFAULT '' COMMENT '昵称',
  `password` varchar(20) NOT NULL COMMENT '密码',
  `notebooks` json DEFAULT NULL COMMENT '用户笔记本列表',
  `basket` json DEFAULT NULL COMMENT '废纸篓',
  `uuid` varchar(200) NOT NULL COMMENT '用户uid',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for note_notebook
-- 用户笔记表
-- ----------------------------
DROP TABLE IF EXISTS `note_db`.`note_notebook`;
CREATE TABLE `note_notebook` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_note_title` varchar(200) DEFAULT '' COMMENT '文章标题',
  `sub_note_html` longtext COMMENT '文章的html',
  `sub_note_markdown` longtext COMMENT '文章的markdown',
  `user_id` varchar(200) NOT NULL COMMENT '用户id',
  `notebook_name` varchar(200) NOT NULL COMMENT '笔记本名称',
  `notebook_id` varchar(200) DEFAULT NULL COMMENT '笔记id',
  `note_created_time` bigint(20) DEFAULT NULL COMMENT '创建时间',
  `sub_note_created_time` bigint(20) DEFAULT NULL COMMENT '子笔记创建时间',
  `is_notebook` int(11) DEFAULT '0' COMMENT '是否是笔记本，0是1否',
  `sub_note_id` varchar(200) DEFAULT NULL COMMENT '子笔记id',
  `is_sub_notebook` int(11) DEFAULT NULL COMMENT '是否是子笔记1是0否',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;


