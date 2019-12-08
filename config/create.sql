-- 用户表
USE `note_db`;
DROP TABLE IF EXISTS `note_db`.`user`;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键、自增',
  `email` varchar(100) DEFAULT '' COMMENT '邮箱',
  `phone` varchar(20) DEFAULT '' COMMENT '手机号',
  `account` varchar(20) DEFAULT '' COMMENT '登陆账号',
  `password` varchar(20) NOT NULL COMMENT '密码',
  `nickname` varchar(20) DEFAULT '' COMMENT '昵称',
  `name` varchar(20) DEFAULT '' COMMENT '真实姓名',
  `avatar_url` varchar(2083) DEFAULT '' COMMENT '头像地址',
  `uuid` varchar(100) NOT NULL COMMENT '用户uid',
  `created_at` datetime NOT NULL COMMENT '用户创建时间值',
  `created_at_timestamp` bigint(20) NOT NULL COMMENT '用户创建时间戳',
  `headline` varchar(200) DEFAULT '' COMMENT '个性签名',
  `type` enum('User','Admin','Super_Admin') NOT NULL COMMENT '用户类型',
  `user_login_version` varchar(200) NOT NULL COMMENT '用户登陆版本号',
  `gender` smallint(10) DEFAULT '0' COMMENT '性别，0无1男2女',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建最近使用表
USE `note_db`;
DROP TABLE IF EXISTS `note_db`.`recent`;
CREATE TABLE `recent` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键、自增',
  `type` varchar(100) NOT NULL COMMENT '消息类型,Edit|CreateEdit|CreateSpace|UpdateEdit|UpdateSpace|DeleteEdit|DeleteSpace|Share',
  `created_at` varchar(100) NOT NULL COMMENT '上次更新时间值',
  `uuid` varchar(100) NOT NULL COMMENT '用户uuid',
  `space_id` varchar(200) DEFAULT '' COMMENT '空间唯一id',
  `doc_id` varchar(200) DEFAULT '' COMMENT '文档唯一id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建空间表
USE `note_db`;
DROP TABLE IF EXISTS `note_db`.`space`;
CREATE TABLE `space` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键、自增',
  `created_at` datetime NOT NULL COMMENT '用户创建时间值',
  `updated_at` datetime DEFAULT NULL COMMENT '空间更新时间',
  `content_updated_at` datetime DEFAULT NULL COMMENT '内容更新时间',
  `description` varchar(200) DEFAULT '' COMMENT '描述',
  `name` varchar(200) DEFAULT '' COMMENT '名称',
  `scene` varchar(200) DEFAULT 'docs' COMMENT '场景，枚举docs/notes',
  `uuid` varchar(100) NOT NULL COMMENT 'userId',
  `public` varchar(200) NOT NULL COMMENT '可见范围',
  `space_id` varchar(200) NOT NULL COMMENT '空间唯一id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建文档表
USE `note_db`;
DROP TABLE IF EXISTS `note_db`.`doc`;
CREATE TABLE `doc` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键、自增',
  `doc_id` varchar(200) NOT NULL COMMENT '文档id',
  `created_at` varchar(100) NOT NULL COMMENT '首次创建时间值',
  `updated_at` varchar(100) NOT NULL COMMENT '上次更新时间值',
  `draft_update_at` varchar(100) NOT NULL COMMENT '草稿内容上次更新时间',
  `updated_at_timestamp` bigint(20) NOT NULL COMMENT '上次更新的时间戳,发布更新或者保存草稿均会更新该时间戳',
  `title` varchar(100) DEFAULT '无标题' COMMENT '文档主题',
  `markdown` longtext NOT NULL COMMENT '最新文档文本内容',
  `markdown_draft` longtext COMMENT '文本内容草稿',
  `html` longtext NOT NULL COMMENT '最新文档html',
  `html_draft` longtext COMMENT '文档html草稿',
  `url` varchar(2083) NOT NULL COMMENT '文档地址',
  `scene` varchar(100) NOT NULL COMMENT '文档所属space类型',
  `space_id` varchar(200) NOT NULL COMMENT '知识库id',
  `uuid` varchar(100) NOT NULL COMMENT '用户uuid',
  `status` varchar(100) DEFAULT NULL COMMENT '状态：已更新UPDATE、分享中SHARE、未发布UN_PUBLIC',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;