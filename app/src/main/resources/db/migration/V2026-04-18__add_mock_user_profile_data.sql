-- V2026-04-18__add_mock_user_profile_data.sql
-- 模拟用户数据，用于演示个人画像和知识图谱功能

-- 插入用户画像
INSERT INTO user_profiles (user_id, target_role, updated_at)
VALUES ('0', 'Java 后端开发工程师', CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO NOTHING;

-- 插入技能掌握数据
INSERT INTO user_topic_mastery (user_id, topic, score, session_count, last_assessed, created_at, updated_at)
VALUES
    ('0', 'Java基础', 82.5, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0', 'Spring框架', 75.0, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0', '数据库', 68.5, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0', 'Redis缓存', 58.0, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0', '微服务', 72.0, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0', '操作系统', 55.5, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0', '计算机网络', 63.0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0', '数据结构与算法', 48.5, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (user_id, topic) DO UPDATE SET
    score = EXCLUDED.score,
    session_count = EXCLUDED.session_count,
    updated_at = CURRENT_TIMESTAMP;

-- 插入弱项数据（用于知识图谱和复习）
INSERT INTO user_weak_points (user_id, topic, question_text, answer_summary, score, source, session_id, sr_state, is_improved, times_seen, first_seen, last_seen)
VALUES
    ('0', 'Java基础', '请解释一下 Java 中的 volatile 关键字的作用和实现原理', 'volatile 保证可见性和有序性，但不保证原子性。它通过内存屏障实现，防止指令重排序。', 35.0, 'MOCK_INTERVIEW', 101,
     '{"interval_days":1,"ease_factor":1.8,"repetitions":2,"next_review":"2026-04-20","last_score":35}', FALSE, 4, '2026-04-01 10:00:00', '2026-04-15 14:30:00'),
    ('0', 'Java基础', 'HashMap 在并发环境下可能出现哪些问题？', '可能产生死循环、数据丢失、数据覆盖等问题。JDK1.8 对 HashMap 做了优化，但并发场景仍需使用 ConcurrentHashMap。', 40.0, 'MOCK_INTERVIEW', 102,
     '{"interval_days":2,"ease_factor":1.9,"repetitions":2,"next_review":"2026-04-23","last_score":40}', TRUE, 4, '2026-04-02 11:00:00', '2026-04-14 16:00:00'),
    ('0', 'Java基础', 'synchronized 和 ReentrantLock 的区别是什么？', 'synchronized 是 JVM 内置关键字，自动释放锁；ReentrantLock 是 API 级别，需手动释放。支持公平锁、可中断锁等待等高级特性。', 58.0, 'MOCK_INTERVIEW', 103,
     '{"interval_days":3,"ease_factor":2.0,"repetitions":3,"next_review":"2026-04-22","last_score":58}', FALSE, 5, '2026-04-03 09:00:00', '2026-04-15 10:00:00'),
    ('0', 'Java基础', 'ThreadLocal 的原理和使用场景', 'ThreadLocal 为每个线程提供独立变量副本，通过 ThreadLocalMap 实现。用于线程隔离场景如数据库连接、Session管理等。', 48.0, 'MOCK_INTERVIEW', 104,
     '{"interval_days":1,"ease_factor":1.7,"repetitions":2,"next_review":"2026-04-19","last_score":48}', FALSE, 3, '2026-04-04 14:00:00', '2026-04-16 11:00:00'),
    ('0', 'Java基础', 'JVM 内存模型中堆和栈的区别', '堆是线程共享区域，存储对象实例；栈是线程私有，存储局部变量、方法参数。堆 GC 管理，栈自动管理。', 68.0, 'MOCK_INTERVIEW', 105,
     '{"interval_days":4,"ease_factor":2.1,"repetitions":4,"next_review":"2026-04-25","last_score":68}', FALSE, 6, '2026-03-20 10:00:00', '2026-04-12 09:00:00'),

    ('0', 'Spring框架', 'Spring Bean 的生命周期是怎样的？', '实例化→属性填充→初始化→销毁。涉及 BeanFactoryPostProcessor、BeanPostProcessor 等扩展点。', 55.0, 'MOCK_INTERVIEW', 106,
     '{"interval_days":2,"ease_factor":2.2,"repetitions":4,"next_review":"2026-04-24","last_score":55}', FALSE, 7, '2026-03-22 15:00:00', '2026-04-15 13:00:00'),
    ('0', 'Spring框架', 'Spring 如何解决循环依赖？', '通过三级缓存解决：singletonObjects、earlySingletonObjects、singletonFactories。提前暴露半成品 Bean。', 45.0, 'MOCK_INTERVIEW', 107,
     '{"interval_days":1,"ease_factor":1.9,"repetitions":2,"next_review":"2026-04-20","last_score":45}', FALSE, 3, '2026-04-05 10:00:00', '2026-04-14 15:00:00'),
    ('0', 'Spring框架', 'Spring AOP 的实现原理', '基于代理模式，JDK 动态代理或 CGLIB 字节码增强。代理对象持有目标对象引用，方法调用前后加入增强逻辑。', 72.0, 'MOCK_INTERVIEW', 108,
     '{"interval_days":5,"ease_factor":2.3,"repetitions":5,"next_review":"2026-04-28","last_score":72}', TRUE, 8, '2026-03-18 11:00:00', '2026-04-10 10:00:00'),

    ('0', '数据库', '什么是数据库事务的 ACID 特性？MySQL 如何保证这些特性？', 'ACID 包括原子性、一致性、隔离性、持久性。MySQL 通过 InnoDB 的 MVCC 和锁机制实现。', 42.0, 'MOCK_INTERVIEW', 109,
     '{"interval_days":1,"ease_factor":2.0,"repetitions":3,"next_review":"2026-04-22","last_score":42}', FALSE, 6, '2026-04-01 09:00:00', '2026-04-16 14:00:00'),
    ('0', '数据库', 'MySQL 索引失效的几种情况', '索引列使用函数、表达式、LIKE 前缀匹配、OR 连接不同列、使用 IS NULL 等会导致索引失效。', 55.0, 'MOCK_INTERVIEW', 110,
     '{"interval_days":2,"ease_factor":2.1,"repetitions":3,"next_review":"2026-04-23","last_score":55}', FALSE, 5, '2026-03-25 14:00:00', '2026-04-13 11:00:00'),
    ('0', '数据库', 'MySQL MVCC 原理是什么？', 'Multi-Version Concurrency Control，通过隐藏列、Undo Log 和 ReadView 实现不同隔离级别的一致性读。', 38.0, 'MOCK_INTERVIEW', 111,
     '{"interval_days":1,"ease_factor":1.6,"repetitions":2,"next_review":"2026-04-19","last_score":38}', FALSE, 3, '2026-04-06 10:00:00', '2026-04-15 16:00:00'),
    ('0', '数据库', 'SQL 优化有哪些常用手段？', '避免 SELECT *、合理创建索引、使用 EXPLAIN 分析执行计划、优化子查询为 JOIN、批量操作减少数据库交互。', 48.0, 'MOCK_INTERVIEW', 112,
     '{"interval_days":2,"ease_factor":1.8,"repetitions":3,"next_review":"2026-04-24","last_score":48}', FALSE, 4, '2026-04-02 15:00:00', '2026-04-14 10:00:00'),

    ('0', 'Redis缓存', 'Redis 的持久化机制有哪些？RDB 和 AOF 各自的优缺点是什么？', 'RDB 是快照持久化，保存点在某个时间点的完整数据。AOF 是命令日志持久化，记录每次写操作。', 38.0, 'MOCK_INTERVIEW', 113,
     '{"interval_days":1,"ease_factor":1.6,"repetitions":2,"next_review":"2026-04-19","last_score":38}', FALSE, 3, '2026-04-03 11:00:00', '2026-04-16 09:00:00'),
    ('0', 'Redis缓存', 'Redis 内存淘汰策略有哪些？', 'noeviction、allkeys-lru、allkeys-random、volatile-lru、volatile-random、volatile-ttl 等策略。', 55.0, 'MOCK_INTERVIEW', 114,
     '{"interval_days":2,"ease_factor":2.0,"repetitions":3,"next_review":"2026-04-22","last_score":55}', FALSE, 4, '2026-04-01 14:00:00', '2026-04-13 15:00:00'),
    ('0', 'Redis缓存', '如何解决缓存穿透、击穿、雪崩问题？', '穿透：布隆过滤器/空值缓存；击穿：互斥锁/永不过期+异步更新；雪崩：随机过期时间+多级缓存。', 45.0, 'MOCK_INTERVIEW', 115,
     '{"interval_days":1,"ease_factor":1.9,"repetitions":2,"next_review":"2026-04-21","last_score":45}', FALSE, 3, '2026-04-07 10:00:00', '2026-04-15 11:00:00'),

    ('0', '微服务', '分布式事务解决方案有哪些？', '2PC、TCC、Saga、本地消息表、最大努力通知等方案，各有适用场景。', 48.0, 'MOCK_INTERVIEW', 116,
     '{"interval_days":1,"ease_factor":1.7,"repetitions":2,"next_review":"2026-04-20","last_score":48}', FALSE, 3, '2026-04-04 09:00:00', '2026-04-14 16:00:00'),
    ('0', '微服务', 'Sentinel 和 Hystrix 对比', 'Sentinel 是阿里开源，支持更丰富的流量控制策略，与 Spring Cloud Alibaba 集成更好。Hystrix 已进入维护模式。', 58.0, 'MOCK_INTERVIEW', 117,
     '{"interval_days":2,"ease_factor":2.1,"repetitions":3,"next_review":"2026-04-23","last_score":58}', FALSE, 4, '2026-03-28 14:00:00', '2026-04-12 10:00:00'),
    ('0', '微服务', '服务注册与发现原理', '服务提供者向注册中心注册，消费者从注册中心获取服务列表，通过负载均衡进行调用。常用 Zookeeper、Nacos、Eureka。', 70.0, 'MOCK_INTERVIEW', 118,
     '{"interval_days":4,"ease_factor":2.2,"repetitions":4,"next_review":"2026-04-26","last_score":70}', TRUE, 5, '2026-03-20 11:00:00', '2026-04-11 14:00:00'),

    ('0', '操作系统', '进程和线程有什么区别？什么情况下应该使用多线程而不是多进程？', '进程是资源分配的基本单位，线程是CPU调度的基本单位。线程共享进程资源，创建/切换开销小。', 45.0, 'MOCK_INTERVIEW', 119,
     '{"interval_days":1,"ease_factor":2.1,"repetitions":3,"next_review":"2026-04-21","last_score":45}', FALSE, 5, '2026-04-02 10:00:00', '2026-04-15 15:00:00'),
    ('0', '操作系统', '死锁的必要条件及如何避免？', '必要条件：互斥、占有并等待、非抢占、循环等待。避免：破坏环路等待条件，使用锁顺序一致、超时机制等。', 48.0, 'MOCK_INTERVIEW', 120,
     '{"interval_days":2,"ease_factor":1.8,"repetitions":2,"next_review":"2026-04-22","last_score":48}', FALSE, 4, '2026-04-03 14:00:00', '2026-04-14 11:00:00'),
    ('0', '操作系统', '页面置换算法有哪些？', '常见算法：FIFO、LRU、LFU、CLOCK、工作集模型。LRU 性能较好但实现复杂。', 62.0, 'MOCK_INTERVIEW', 121,
     '{"interval_days":3,"ease_factor":2.0,"repetitions":3,"next_review":"2026-04-24","last_score":62}', FALSE, 4, '2026-03-26 10:00:00', '2026-04-13 09:00:00'),

    ('0', '计算机网络', 'TCP 三次握手和四次挥手的过程是怎样的？为什么需要四次挥手？', '三次握手用于建立连接，四次挥手用于关闭连接。四次挥手是因为 TCP 是全双工通信，需要双方分别发送 FIN。', 50.0, 'MOCK_INTERVIEW', 122,
     '{"interval_days":2,"ease_factor":2.0,"repetitions":3,"next_review":"2026-04-26","last_score":50}', FALSE, 5, '2026-04-01 15:00:00', '2026-04-16 10:00:00'),
    ('0', '计算机网络', 'TCP 和 UDP 的区别是什么？', 'TCP 面向连接、可靠、有拥塞控制；UDP 无连接、不可靠、但效率高。实时音视频、游戏等适合 UDP。', 68.0, 'MOCK_INTERVIEW', 123,
     '{"interval_days":4,"ease_factor":2.2,"repetitions":4,"next_review":"2026-04-27","last_score":68}', TRUE, 6, '2026-03-22 09:00:00', '2026-04-12 14:00:00'),
    ('0', '计算机网络', 'HTTP 和 HTTPS 的区别是什么？', 'HTTPS = HTTP + TLS/SSL，提供加密传输和身份认证。HTTPS 使用 443 端口，HTTP 使用 80 端口。', 72.0, 'MOCK_INTERVIEW', 124,
     '{"interval_days":5,"ease_factor":2.3,"repetitions":5,"next_review":"2026-04-28","last_score":72}', TRUE, 7, '2026-03-18 14:00:00', '2026-04-11 11:00:00'),
    ('0', '计算机网络', '从输入 URL 到页面显示，发生了什么？', 'DNS 解析→TCP 连接→发送 HTTP 请求→服务器处理→返回响应→浏览器解析渲染→JS 执行等步骤。', 58.0, 'MOCK_INTERVIEW', 125,
     '{"interval_days":2,"ease_factor":2.1,"repetitions":3,"next_review":"2026-04-25","last_score":58}', FALSE, 4, '2026-03-27 11:00:00', '2026-04-13 16:00:00'),

    ('0', '数据结构与算法', '请手写一个 LRU 缓存实现', '使用 HashMap + LinkedList 实现，HashMap 保证 O(1) 查找，LinkedList 保证 O(1) 插入和删除。', 28.0, 'MOCK_INTERVIEW', 126,
     '{"interval_days":1,"ease_factor":1.5,"repetitions":1,"next_review":"2026-04-25","last_score":28}', FALSE, 2, '2026-04-08 10:00:00', '2026-04-16 15:00:00'),
    ('0', '数据结构与算法', 'TopK 问题的解决方案有哪些？', '快排分区思想、堆排序、BFPRT 算法。数据量大时用堆，数据量小可用快排。', 48.0, 'MOCK_INTERVIEW', 127,
     '{"interval_days":1,"ease_factor":1.8,"repetitions":2,"next_review":"2026-04-21","last_score":48}', FALSE, 3, '2026-04-05 14:00:00', '2026-04-15 09:00:00'),
    ('0', '数据结构与算法', '字典树（Trie）是什么？有哪些应用场景？', '前缀树，用于字符串检索、词频统计、自动补全、IP 路由最长前缀匹配等场景。', 52.0, 'MOCK_INTERVIEW', 128,
     '{"interval_days":2,"ease_factor":2.0,"repetitions":3,"next_review":"2026-04-24","last_score":52}', FALSE, 4, '2026-03-29 10:00:00', '2026-04-14 13:00:00'),
    ('0', '数据结构与算法', '滑动窗口最大值如何求解？', '使用双端队列，队首维护当前窗口最大值。进队时删除比新元素小的元素，出队时移除过期元素。', 58.0, 'MOCK_INTERVIEW', 129,
     '{"interval_days":2,"ease_factor":2.1,"repetitions":3,"next_review":"2026-04-25","last_score":58}', FALSE, 4, '2026-04-02 09:00:00', '2026-04-13 10:00:00'),
    ('0', '数据结构与算法', '回溯算法模板', '核心是选择、递归、撤销选择。适用于子集、组合、排列、棋盘（N皇后）等组合优化问题。', 45.0, 'MOCK_INTERVIEW', 130,
     '{"interval_days":1,"ease_factor":1.9,"repetitions":2,"next_review":"2026-04-20","last_score":45}', FALSE, 3, '2026-04-06 11:00:00', '2026-04-15 14:00:00')
ON CONFLICT (user_id, question_text) DO NOTHING;

-- 插入强项数据
INSERT INTO user_strong_points (user_id, topic, description, source, session_id, first_seen)
VALUES
    ('0', 'Java基础', '对 Java 集合类框架有深入理解，能清晰讲解 ArrayList、LinkedList、HashMap 等的底层实现和适用场景', 'MOCK_INTERVIEW', 201, '2026-03-15 10:00:00'),
    ('0', 'Spring框架', '熟悉 Spring IoC 和 AOP 原理，能够手写简单的 Spring 框架，理解代理模式和字节码增强机制', 'MOCK_INTERVIEW', 202, '2026-03-18 14:00:00'),
    ('0', '微服务', '对微服务架构有较好理解，熟悉服务注册发现、负载均衡、熔断降级等基础概念和实现', 'MOCK_INTERVIEW', 203, '2026-03-20 11:00:00'),
    ('0', 'Java基础', '理解 JVM 内存模型、垃圾回收算法和类加载机制，能够进行 JVM 调优和问题排查', 'MOCK_INTERVIEW', 204, '2026-03-22 09:00:00'),
    ('0', '计算机网络', '对 HTTP/HTTPS 协议有深入理解，熟悉 SSL/TLS 握手过程和加密原理', 'MOCK_INTERVIEW', 205, '2026-03-25 15:00:00'),
    ('0', '数据库', '熟悉 MySQL 架构和 InnoDB 存储引擎，了解 MVCC 和锁机制原理', 'MOCK_INTERVIEW', 206, '2026-03-28 10:00:00')
ON CONFLICT DO NOTHING;
