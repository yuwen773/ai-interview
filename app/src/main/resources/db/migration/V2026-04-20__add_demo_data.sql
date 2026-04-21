-- V2026-04-20__add_demo_data.sql
-- 全流程演示数据：简历 + 面试 + 知识库 + RAG 聊天
-- 使用 100+ ID 避免与现有数据冲突

-- ============================================================
-- 1. resumes（现有 id=1,2,3，跳过）
-- ============================================================
INSERT INTO resumes (id, file_hash, original_filename, file_size, content_type, storage_key, storage_url, resume_text, uploaded_at, last_accessed_at, access_count, analyze_status, analyze_error)
VALUES
    (100, 'demo_hash_java_001', '张明_Java开发工程师.pdf', 245760, 'application/pdf', 'resumes/demo/java_dev.pdf', 'http://minio:9000/resumes/demo/java_dev.pdf',
     E'张明\nJava 后端开发工程师 | 5 年经验 | 本科·计算机科学\n\n手机：138-0000-1001 | 邮箱：zhangming@example.com\n\n技术栈：Java / Spring Boot / MySQL / Redis / Kafka / Docker\n\n工作经历\n\n2021.06 - 至今   某互联网金融公司 | Java 后端开发工程师\n- 负责交易系统核心模块设计与开发，日均处理 10 万 + 请求\n- 基于 Redis 实现分布式缓存，响应时间降低 60%\n- 主导微服务拆分项目，采用 Spring Cloud Alibaba 架构\n\n2018.07 - 2021.05   某科技公司 | Java 开发工程师\n- 参与订单系统开发，独立完成支付模块重构\n- 优化 SQL 语句 200 + 条，平均查询时间从 800ms 降至 50ms\n\n项目经历\n\n2022.03 - 2022.10   分布式交易平台\n- 技术：Spring Boot / Redis / Kafka / MySQL\n- 实现：支持高并发下单、分布式事务、可靠消息投递\n\n教育背景\n2014.09 - 2018.06   某理工大学 | 计算机科学与技术 | 本科',
     '2026-04-10 09:00:00', '2026-04-18 14:30:00', 12, 'COMPLETED', NULL),
    (101, 'demo_hash_python_002', '李娜_Python算法工程师.pdf', 184320, 'application/pdf', 'resumes/demo/python_dev.pdf', 'http://minio:9000/resumes/demo/python_dev.pdf',
     E'李娜\nPython 算法工程师 | 3 年经验 | 硕士·人工智能\n\n手机：139-0000-1002 | 邮箱：lina@example.com\n\n技术栈：Python / PyTorch / TensorFlow / Redis / FastAPI / Docker\n\n工作经历\n\n2023.01 - 至今   某 AI 创业公司 | Python 算法工程师\n- 负责推荐算法研发，CTR 提升 15%\n- 基于 FastAPI 构建模型推理服务，日均调用 50 万次\n\n2020.07 - 2022.12   某电商公司 | 数据分析师\n- 基于用户行为数据构建画像，精准营销转化率提升 20%\n\n项目经历\n\n2023.06 - 2024.02   智能推荐系统\n- 技术：Python / PyTorch / Redis / FastAPI\n- 实现：协同过滤 + 深度学习混合推荐，AB 测试 CTR + 15%\n\n教育背景\n2017.09 - 2020.06   某985高校 | 人工智能 | 硕士\n2013.09 - 2017.06   某985高校 | 计算机科学与技术 | 本科',
     '2026-04-11 10:00:00', '2026-04-17 16:00:00', 8, 'COMPLETED', NULL)
ON CONFLICT (file_hash) DO NOTHING;

-- ============================================================
-- 2. resume_analyses
-- ============================================================
INSERT INTO resume_analyses (resume_id, overall_score, content_score, structure_score, skill_match_score, expression_score, project_score, summary, strengths_json, suggestions_json, analyzed_at)
VALUES
    (100, 78, 22, 16, 20, 10, 10,
     '张明同学的简历整体质量良好，具有扎实的 Java 后端开发经验和丰富的项目积累。建议加强微服务架构深度和并发编程高级特性的理解。',
     '["具备完整的大型系统设计与开发经验","数据库优化经验丰富，能将查询时间从 800ms 降至 50ms","技术栈与岗位匹配度高","项目描述清晰，职责分明"]',
     '["建议补充对 AQS、Lock 等并发编程深层原理的理解","项目经验中可增加具体 QPS/TPS 数据支撑","补充分布式事务处理经验（如 Seata）的具体实践","建议补充对消息队列（如 Kafka）可靠投递机制的深入理解"]',
     '2026-04-10 09:05:00'),
    (101, 75, 20, 15, 18, 12, 10,
     '李娜同学的简历学术背景扎实，AI 方向项目经验与岗位契合。建议丰富工业级系统上线经验，加强高并发服务优化能力。',
     '["学术背景扎实，人工智能方向匹配度好","推荐算法项目有实际线上效果，AB 测试数据支撑","有 FastAPI 构建推理服务的经验","表达清晰，项目逻辑连贯"]',
     '["建议补充高并发场景（50 万 + QPS）的优化经验","可增加对模型部署、模型监控的深入实践","建议补充分布式训练或模型并行经验","加强系统设计能力，增加架构设计类项目"]',
     '2026-04-11 10:10:00')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. interview_sessions（现有 id=1 跳过）
-- ============================================================
INSERT INTO interview_sessions (id, session_id, resume_id, total_questions, job_role, job_label_snapshot, current_question_index, status, questions_json, overall_score, overall_feedback, strengths_json, improvements_json, reference_answers_json, created_at, completed_at, evaluate_status, evaluate_error)
VALUES
    (100, 'demo-session-java-001', 100, 5, 'JAVA_BACKEND', 'Java 后端开发工程师', 5, 'COMPLETED',
     '["第一题：HashMap 在 JDK1.8 的底层结构是什么？它是如何解决哈希碰撞的？","第二题：请解释 synchronized 和 ReentrantLock 的区别及底层实现原理。","第三题：Spring Boot 的启动流程是怎样的？自动配置是如何实现的？","第四题：MySQL InnoDB 的 MVCC 原理是什么？ReadView 何时生成？","第五题：Redis 有哪些持久化机制？RDB 和 AOF 各自的优缺点和使用场景是什么？"]',
     72, '本次面试覆盖了 Java 核心机制、Spring 框架、数据库和缓存四大方向。整体表现良好，HashMap 底层结构、synchronized 基础概念回答准确。建议加强对底层原理（偏向锁、AQS）和 MySQL 锁机制的理解。',
     '["HashMap底层数据结构（数组 + 链表/红黑树）讲解清晰","synchronized基本概念和使用方式掌握扎实","Spring Boot自动配置原理理解正确","Redis持久化机制能准确区分RDB和AOF的特点"]',
     '["对JVM偏向锁、轻量级锁、重量级锁的转换条件理解不够深入","ReentrantLock的AQS底层实现（CAS + Park/Unpark）理解不足","MySQL MVCC的ReadView生成时机和具体使用场景需要加强","Redis AOF三种刷盘策略（always/everysec/no）的细节需要补充"]',
     '["HashMap在JDK1.8后采用数组+链表+红黑树结构，当链表长度超过8时转为红黑树，查找时间复杂度从O(n)降到O(logn)。哈希碰撞通过链地址法解决，插入时若冲突则插入链表头部。","synchronized是JVM内置关键字，通过ACC_SYNCHRONIZED和管程实现，自动释放锁。ReentrantLock是API级别支持公平/非公平锁、可中断锁等待、公平锁策略，需手动解锁，底层基于AQS。","Spring Boot启动流程：main() → SpringApplication.run() → createApplicationContext() → refreshContext() → onRefresh() → initMessageSource() → onClose()。自动配置通过@EnableAutoConfiguration + META-INF/spring.factories读取Condition匹配的配置类实现。","MySQL InnoDB MVCC通过隐藏列（DB_TRX_ID、DB_ROLL_PTR、DB_ROW_ID）、Undo Log版本链和ReadView实现。ReadView在快照读时生成，包含活跃事务列表和活跃事务ID下限，判断可见性时比较trx_id。","Redis持久化：RDB是定时快照，fork子进程执行，宕机可能丢失最近数据，适合大规模数据迁移。AOF记录每次写命令，always模式零丢失但性能差，everysec是性能和安全的平衡。"]',
     '2026-04-12 14:00:00', '2026-04-12 14:35:00', 'COMPLETED', NULL),

    (101, 'demo-session-java-002', 100, 3, 'JAVA_BACKEND', 'Java 后端开发工程师', 3, 'COMPLETED',
     '["第一题：请解释什么是缓存穿透、缓存击穿、缓存雪崩，以及如何解决？","第二题：谈谈你对分布式事务的理解，以及 2PC 和 TCC 的区别。","第三题：JVM 垃圾回收算法有哪些？G1 和 ZGC 的区别是什么？"]',
     68, '本场面试聚焦分布式系统和 JVM 底层。候选人能较好地描述常见问题和解决方案，但在分布式事务细节和新型 GC 算法上需进一步深入。',
     '["分布式系统常见问题（穿透/击穿/雪崩）理解全面，解决思路清晰","2PC、TCC、Saga等分布式事务方案掌握较好","JVM垃圾回收算法基本概念回答正确"]',
     '["对Sentinel的熔断策略（慢调用比例、异常比例、异常数）细节掌握不够深入","G1的分区、Remembered Set、CMS的并发标记（三色标记）细节不够清晰","ZGC的读屏障、染色指针技术理解不足"]',
     '["缓存穿透：Key不存在导致请求直达数据库，布隆过滤器或缓存空值解决。缓存击穿：热点Key过期瞬间大量请求击穿到数据库，分布式锁或热点数据永不过期解决。缓存雪崩：大量Key同时过期或Redis宕机，随机TTL、多级缓存、Redis高可用解决。","分布式事务：2PC是二阶段提交，事务管理器协调Prepare和Commit，协调者宕机会导致资源锁定。TCC是 Try-Confirm-Cancel，业务代码编写三个接口，优点是性能好，缺点是业务侵入性强。","JVM垃圾回收算法：标记清除（内存碎片）、标记整理（移动存活对象）、复制算法（年轻代）。G1是分区式收集器，将堆分为多个Region，可设置停顿时间目标，适合大堆。ZGC是着色指针技术，停顿时间不超过1ms，与堆大小无关，但不支持类卸载。"]',
     '2026-04-15 10:00:00', '2026-04-15 10:28:00', 'COMPLETED', NULL),

    (102, 'demo-session-python-001', 101, 4, 'PYTHON_ALGORITHM', 'Python 算法工程师', 4, 'COMPLETED',
     '["第一题：解释 Python 中浅拷贝和深拷贝的区别，以及适用场景。","第二题：手写一个 LRU 缓存实现（要求 O(1) 复杂度）。","第三题：什么是装饰器？Python 装饰器的原理是什么？请手写一个带参数的装饰器。","第四题：解释 Python 中的生成器（Generator）和迭代器（Iterator）的区别。"]',
     80, '候选人 Python 基础扎实，算法能力较强。LRU 缓存实现思路清晰，装饰器掌握深入。算法方向与岗位高度匹配。',
     '["LRU缓存实现思路清晰，HashMap + 双向链表结构设计合理","装饰器原理理解透彻，能正确解释@wraps的作用","生成器和迭代器的区别讲解清晰，yield关键字理解正确"]',
     '["生成器在内存优化方面的底层实现（Lazy Evaluation）理解可以更深入","装饰器在类上的使用（__call__魔术方法）可以补充","TopK问题的多种解法（堆、快排、BFPRT）可以进一步扩展"]',
     '["浅拷贝：构造新的容器对象，但容器内的元素（引用）不变。深拷贝：递归拷贝所有层级，包括内层对象。适用场景：浅拷贝适合一维列表去重，深拷贝适合嵌套对象。","使用HashMap + 双向链表实现，HashMap保证O(1)查找，链表头部插入最新访问节点，尾部是最久未访问。get时移到头部，put时插入头部并删除尾部。","装饰器本质是一个函数，接收被装饰函数作为参数，返回一个新函数。原理：Python函数是一等公民，装饰器在函数定义时执行。带参数的装饰器：外层函数接收参数，中层函数接收被装饰函数，内层函数执行目标逻辑。@wraps保留原函数元信息（name、doc）。","迭代器：实现__iter__和__next__方法，可通过next()手动控制。生成器：使用yield关键字，自动实现迭代器协议，本质是懒加载的迭代器，每次迭代生成一个值，内存效率高。"]',
     '2026-04-16 15:00:00', '2026-04-16 15:40:00', 'COMPLETED', NULL),

    (103, 'demo-session-java-003', 100, 5, 'JAVA_BACKEND', 'Java 后端开发工程师', 2, 'IN_PROGRESS',
     '["第一题：请解释 Java 中的 volatile 关键字的作用和实现原理。","第二题：HashMap 在并发环境下可能出现哪些问题？","第三题：ThreadLocal 的原理和使用场景是什么？","第四题：什么是死锁？如何避免死锁？","第五题：synchronized 和 ReentrantLock 如何选择？"]',
     NULL, NULL, NULL, NULL, NULL, NULL,
     '2026-04-20 09:30:00', NULL, 'PENDING', NULL)
ON CONFLICT (session_id) DO NOTHING;

-- ============================================================
-- 4. interview_answers
-- ============================================================
INSERT INTO interview_answers (id, session_id, question_index, question, category, user_answer, score, feedback, reference_answer, key_points_json, answered_at)
VALUES
    (100, 100, 0, 'HashMap 在 JDK1.8 的底层结构是什么？它是如何解决哈希碰撞的？', 'Java基础',
     'HashMap在JDK1.8之后采用数组+链表+红黑树的底层结构。当哈希冲突时使用链地址法解决，如果链表长度超过8，会将链表转为红黑树，这样可以保证查找效率从O(n)降到O(logn)。插入时使用尾插法。',
     75, '基础概念回答正确，对链表转红黑树的触发条件（长度8）回答准确。建议补充 resize 机制和负载因子相关细节。',
     'HashMap在JDK1.8后采用数组+链表+红黑树结构，当链表长度超过8时转为红黑树，查找时间复杂度从O(n)降到O(logn)。哈希碰撞通过链地址法解决，插入时若冲突则插入链表头部。',
     '["底层结构：数组+链表+红黑树","触发条件：链表长度>8","查找复杂度：O(logn)","解决碰撞：链地址法"]',
     '2026-04-12 14:05:00'),

    (101, 100, 1, '请解释 synchronized 和 ReentrantLock 的区别及底层实现原理。', 'Java并发',
     'synchronized是JVM内置关键字，自动释放锁，适合简单场景。ReentrantLock是API级别，支持公平锁和非公平锁，可中断锁等待，需要手动释放锁，底层基于AQS实现。两者都是可重入锁。',
     70, '基本区别回答正确，对AQS提及准确，但未深入讲解CAS和Park/Unpark底层机制。',
     'synchronized是JVM内置关键字，通过ACC_SYNCHRONIZED和管程实现，自动释放锁。ReentrantLock是API级别支持公平/非公平锁、可中断锁等待、公平锁策略，需手动解锁，底层基于AQS。',
     '["synchronized：JVM内置关键字，ACC_SYNCHRONIZED","ReentrantLock：API级别，支持公平/非公平锁","底层：AQS + CAS + Park/Unpark","可重入：两者都支持"]',
     '2026-04-12 14:12:00'),

    (102, 100, 2, 'Spring Boot 的启动流程是怎样的？自动配置是如何实现的？', 'Spring框架',
     'Spring Boot启动流程：先创建SpringApplication对象，然后调用run方法，在run方法里创建上下文、加载配置、刷新容器。自动配置通过spring-boot-autoconfigure包下的META-INF/spring.factories文件定义配置类，然后通过条件注解@Conditional来判断是否满足加载条件。',
     72, '流程理解正确，spring.factories文件提及准确。建议补充refreshContext内部的细节，如onRefresh和initMessageSource。',
     'Spring Boot启动流程：main() → SpringApplication.run() → createApplicationContext() → refreshContext() → onRefresh() → initMessageSource()。自动配置通过@EnableAutoConfiguration + META-INF/spring.factories读取Condition匹配的配置类实现。',
     '["SpringApplication.run()调用链","createApplicationContext创建上下文","refreshContext刷新容器","spring.factories定义配置类","@Conditional条件注解"]',
     '2026-04-12 14:18:00'),

    (103, 100, 3, 'MySQL InnoDB 的 MVCC 原理是什么？ReadView 何时生成？', '数据库',
     'MySQL InnoDB通过MVCC实现事务隔离，主要靠隐藏列（trx_id、roll_pointer）和Undo Log。当读取数据时，如果该行数据的trx_id在活跃事务列表中，就去Undo Log中找历史版本。ReadView在快照读时生成，包含活跃事务ID列表。',
     65, '核心概念理解正确，但ReadView的生成时机（SELECT语句执行时）和具体可见性判断逻辑未能深入阐述。',
     'MySQL InnoDB MVCC通过隐藏列（DB_TRX_ID、DB_ROLL_PTR、DB_ROW_ID）、Undo Log版本链和ReadView实现。ReadView在快照读时生成，包含活跃事务列表和活跃事务ID下限，判断可见性时比较trx_id。',
     '["隐藏列：DB_TRX_ID、DB_ROLL_PTR","Undo Log构建版本链","ReadView包含活跃事务列表","可见性判断：trx_id与ReadView比较"]',
     '2026-04-12 14:25:00'),

    (104, 100, 4, 'Redis 有哪些持久化机制？RDB 和 AOF 各自的优缺点和使用场景是什么？', 'Redis缓存',
     'Redis有RDB和AOF两种持久化机制。RDB是定时快照，将内存数据保存为二进制文件，恢复快，但可能丢失最近数据，适合大规模数据迁移。AOF是记录每次写命令，always模式零丢失但性能差，everysec是性能和安全的平衡。',
     75, '两种持久化机制的特点描述准确，everysec模式提及正确。建议补充AOF重写机制和后台刷盘原理。',
     'Redis持久化：RDB是定时快照，fork子进程执行，宕机可能丢失最近数据，适合大规模数据迁移。AOF记录每次写命令，always模式零丢失但性能差，everysec是性能和安全的平衡。',
     '["RDB：定时快照，fork子进程","AOF：记录写命令，三种刷盘策略","RDB适用：大规模迁移、快速恢复","AOF适用：数据安全要求高"]',
     '2026-04-12 14:32:00'),

    (105, 101, 0, '请解释什么是缓存穿透、缓存击穿、缓存雪崩，以及如何解决？', 'Redis缓存',
     '缓存穿透是请求的数据既不在缓存也不在数据库，导致数据库压力过大，可以用布隆过滤器或缓存空值解决。缓存击穿是一个热点Key过期瞬间大量请求直接打满数据库，用分布式锁或热点数据永不过期解决。缓存雪崩是大量Key同时过期或Redis宕机，通过随机TTL、多级缓存和Redis高可用解决。',
     78, '三个概念讲解清晰，解决思路全面，布隆过滤器、分布式锁等方案均正确。',
     '缓存穿透：Key不存在导致请求直达数据库，布隆过滤器或缓存空值解决。缓存击穿：热点Key过期瞬间大量请求击穿到数据库，分布式锁或热点数据永不过期解决。缓存雪崩：大量Key同时过期或Redis宕机，随机TTL、多级缓存、Redis高可用解决。',
     '["穿透：布隆过滤器/空值缓存","击穿：分布式锁/永不过期","雪崩：随机TTL/多级缓存/高可用"]',
     '2026-04-15 10:05:00'),

    (106, 101, 1, '谈谈你对分布式事务的理解，以及 2PC 和 TCC 的区别。', '微服务',
     '分布式事务是指跨多个数据库或服务的事务操作，需要保证ACID特性。2PC是二阶段提交，有Prepare和Commit两个阶段，协调者宕机会导致资源锁定。TCC是Try-Confirm-Cancel模式，需要业务代码编写三个接口，性能好但业务侵入性强。',
     70, '概念讲解正确，但未能深入对比两种方案在 CAP 理论下的权衡和适用边界。',
     '分布式事务：2PC是二阶段提交，事务管理器协调Prepare和Commit，协调者宕机会导致资源锁定。TCC是 Try-Confirm-Cancel，业务代码编写三个接口，优点是性能好，缺点是业务侵入性强。',
     '["2PC：Prepare + Commit，协调者单点问题","TCC：Try-Confirm-Cancel，业务侵入性强","区别：TCC性能更好，但需要改业务代码"]',
     '2026-04-15 10:14:00'),

    (107, 101, 2, 'JVM 垃圾回收算法有哪些？G1 和 ZGC 的区别是什么？', 'Java基础',
     'JVM垃圾回收算法有标记清除、标记整理和复制算法。G1是分区式收集器，将堆分为多个Region，可以设置停顿时间目标，适合大内存场景。ZGC使用染色指针技术，停顿时间很短，不到1ms，与堆大小无关。',
     65, '基本算法描述正确，G1特点回答准确，但ZGC的读屏障和着色指针细节理解不够深入。',
     'JVM垃圾回收算法：标记清除（内存碎片）、标记整理（移动存活对象）、复制算法（年轻代）。G1是分区式收集器，将堆分为多个Region，可设置停顿时间目标，适合大堆。ZGC是着色指针技术，停顿时间不超过1ms，与堆大小无关，但不支持类卸载。',
     '["GC算法：标记清除/整理/复制","G1：分区、Region、停顿目标","ZGC：染色指针、<1ms停顿"]',
     '2026-04-15 10:22:00'),

    (108, 102, 0, '解释 Python 中浅拷贝和深拷贝的区别，以及适用场景。', 'Python基础',
     '浅拷贝会创建新的容器对象，但容器内的元素引用不变。深拷贝会递归拷贝所有层级，包括内层对象。浅拷贝适合一维列表去重等简单场景，深拷贝适合嵌套对象如二维列表或字典嵌套字典。',
     80, '概念讲解清晰，适用场景回答正确，is和==的区别也补充得很到位。',
     '浅拷贝：构造新的容器对象，但容器内的元素（引用）不变。深拷贝：递归拷贝所有层级，包括内层对象。适用场景：浅拷贝适合一维列表去重，深拷贝适合嵌套对象。',
     '["浅拷贝：copy()，元素引用不变","深拷贝：deepcopy()，递归拷贝","is：判断同一对象","==：判断值相等"]',
     '2026-04-16 15:05:00'),

    (109, 102, 1, '手写一个 LRU 缓存实现（要求 O(1) 复杂度）。', '数据结构与算法',
     '使用HashMap + 双向链表实现。HashMap存储key到节点的映射，链表头部是最新的，尾部是最久未访问的。get时把节点移到头部，put时插入头部并删除尾部超过容量时。',
     82, '思路正确，HashMap+双向链表结构设计合理，O(1)复杂度分析准确。代码实现需要更完整。',
     '使用HashMap + 双向链表实现，HashMap保证O(1)查找，链表头部插入最新访问节点，尾部是最久未访问。get时移到头部，put时插入头部并删除尾部。',
     '["HashMap：O(1)查找","双向链表：O(1)插入/删除","头部：最新访问","尾部：最久未访问"]',
     '2026-04-16 15:14:00'),

    (110, 102, 2, '什么是装饰器？Python 装饰器的原理是什么？请手写一个带参数的装饰器。', 'Python进阶',
     '装饰器本质是一个函数，接收被装饰函数作为参数，返回一个新函数。Python函数是一等公民，装饰器在函数定义时就执行。带参数的装饰器需要三层嵌套，外层接收参数，中层接收函数，内层执行目标逻辑。@wraps可以保留原函数的元信息。',
     78, '原理理解透彻，三层嵌套结构描述正确，@wraps作用正确。',
     '装饰器本质是一个函数，接收被装饰函数作为参数，返回一个新函数。原理：Python函数是一等公民，装饰器在函数定义时执行。带参数的装饰器：外层函数接收参数，中层函数接收被装饰函数，内层函数执行目标逻辑。@wraps保留原函数元信息（name、doc）。',
     '["本质：返回函数的函数","原理：函数是一等公民","三层嵌套：参数→函数→目标","@wraps保留元信息"]',
     '2026-04-16 15:26:00'),

    (111, 102, 3, '解释 Python 中的生成器（Generator）和迭代器（Iterator）的区别。', 'Python进阶',
     '迭代器需要实现__iter__和__next__方法，可以通过next()手动控制遍历。生成器使用yield关键字，自动实现迭代器协议，是懒加载的，每次迭代生成一个值，内存效率高。',
     78, '区别讲解清晰，yield关键字理解正确。生成器的内存优化优势补充得很好。',
     '迭代器：实现__iter__和__next__方法，可通过next()手动控制。生成器：使用yield关键字，自动实现迭代器协议，本质是懒加载的迭代器，每次迭代生成一个值，内存效率高。',
     '["迭代器：__iter__ + __next__","生成器：yield关键字","懒加载：按需生成","内存效率：生成器更优"]',
     '2026-04-16 15:35:00'),

    (112, 103, 0, '请解释 Java 中的 volatile 关键字的作用和实现原理。', 'Java并发',
     'volatile保证可见性和有序性，不保证原子性。它通过内存屏障实现，防止指令重排序。在写操作后插入Store屏障将数据写回主内存，读操作前插入Load屏障从主内存读取最新值。',
     72, 'volatile保证可见性和有序性回答正确，Store屏障和Load屏障概念准确。',
     'volatile保证可见性和有序性，但不保证原子性。它通过内存屏障实现，防止指令重排序。写操作后Store屏障将数据写回主内存，读操作前Load屏障从主内存读取最新值。',
     '["可见性：一个线程写，其他线程立即见","有序性：禁止指令重排序","内存屏障：Store/Load屏障","不保证原子性"]',
     '2026-04-20 09:32:00'),

    (113, 103, 1, 'HashMap 在并发环境下可能出现哪些问题？', 'Java并发',
     'HashMap在并发环境下可能产生死循环、数据丢失、数据覆盖等问题。JDK1.8对HashMap做了优化（头插改尾插），但并发场景仍需使用ConcurrentHashMap。',
     68, '死循环和数据丢失问题理解正确，但未提及JDK1.8的具体优化细节。',
     '可能产生死循环、数据丢失、数据覆盖等问题。JDK1.8对HashMap做了优化，但并发场景仍需使用ConcurrentHashMap。',
     '["死循环：并发resize时链表成环","数据丢失：并发覆盖","JDK1.8优化：尾插法","ConcurrentHashMap：分段锁/CAS"]',
     '2026-04-20 09:38:00')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. knowledge_bases（现有 id=1,2,3，跳过）
-- ============================================================
INSERT INTO knowledge_bases (id, file_hash, name, category, original_filename, file_size, content_type, storage_key, storage_url, uploaded_at, last_accessed_at, access_count, question_count, vector_status, vector_error, chunk_count)
VALUES
    (100, 'demo_kb_java_001', 'Java核心技术面试手册', '后端技术', 'java_core_handbook.pdf', 524288, 'application/pdf', 'kb/demo/java_core_handbook.pdf', 'http://minio:9000/kb/demo/java_core_handbook.pdf', '2026-04-13 09:00:00', '2026-04-19 15:00:00', 25, 120, 'COMPLETED', NULL, 48),
    (101, 'demo_kb_spring_002', 'Spring Cloud微服务架构实战', '后端技术', 'spring_cloud_practice.pdf', 716800, 'application/pdf', 'kb/demo/spring_cloud_practice.pdf', 'http://minio:9000/kb/demo/spring_cloud_practice.pdf', '2026-04-13 10:00:00', '2026-04-18 11:00:00', 18, 85, 'COMPLETED', NULL, 36),
    (102, 'demo_kb_mysql_003', 'MySQL性能优化与面试题解', '数据库', 'mysql_optimization.pdf', 409600, 'application/pdf', 'kb/demo/mysql_optimization.pdf', 'http://minio:9000/kb/demo/mysql_optimization.pdf', '2026-04-14 14:00:00', '2026-04-20 09:00:00', 32, 95, 'COMPLETED', NULL, 42),
    (103, 'demo_kb_redis_004', 'Redis设计与实现笔记', '缓存中间件', 'redis_implementation.pdf', 358400, 'application/pdf', 'kb/demo/redis_implementation.pdf', 'http://minio:9000/kb/demo/redis_implementation.pdf', '2026-04-14 16:00:00', '2026-04-19 10:00:00', 15, 72, 'COMPLETED', NULL, 30),
    (104, 'demo_kb_python_005', 'Python高级特性与面试实战', 'Python技术', 'python_advanced.pdf', 307200, 'application/pdf', 'kb/demo/python_advanced.pdf', 'http://minio:9000/kb/demo/python_advanced.pdf', '2026-04-15 09:00:00', '2026-04-18 14:00:00', 22, 68, 'COMPLETED', NULL, 28)
ON CONFLICT (file_hash) DO NOTHING;

-- ============================================================
-- 6. rag_chat_sessions（现有 id=1,2,3，跳过）
-- ============================================================
INSERT INTO rag_chat_sessions (id, title, status, created_at, updated_at, message_count, is_pinned)
VALUES
    (100, 'Java HashMap 面试题讨论', 'ACTIVE', '2026-04-17 10:00:00', '2026-04-17 10:35:00', 6, TRUE),
    (101, 'MySQL MVCC 原理咨询', 'ACTIVE', '2026-04-18 14:00:00', '2026-04-18 14:25:00', 4, FALSE),
    (102, 'Redis 缓存问题讨论', 'ARCHIVED', '2026-04-16 09:00:00', '2026-04-16 09:40:00', 8, FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. rag_session_knowledge_bases
-- ============================================================
INSERT INTO rag_session_knowledge_bases (session_id, knowledge_base_id)
VALUES
    (100, 100), (100, 103),
    (101, 102),
    (102, 103)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. rag_chat_messages
-- ============================================================
INSERT INTO rag_chat_messages (id, session_id, type, content, message_order, created_at, updated_at, completed)
VALUES
    (100, 100, 'USER', 'HashMap 在 JDK1.8 为什么改成数组+链表+红黑树的结构？', 0, '2026-04-17 10:00:00', '2026-04-17 10:00:00', TRUE),
    (101, 100, 'ASSISTANT', 'JDK1.8 引入红黑树主要是为了解决哈希碰撞导致的链表过长问题。当链表长度超过 8 时，时间复杂度从 O(n) 降到 O(logn)，这样即使在哈希碰撞严重的情况下也能保证查找效率。', 1, '2026-04-17 10:01:00', '2026-04-17 10:01:00', TRUE),
    (102, 100, 'USER', '那 HashMap 的扩容机制是怎样的？负载因子为什么是 0.75？', 2, '2026-04-17 10:10:00', '2026-04-17 10:10:00', TRUE),
    (103, 100, 'ASSISTANT', 'HashMap 默认容量是 16，负载因子 0.75，所以当元素数量超过 12（16*0.75）时触发扩容，容量翻倍。负载因子 0.75 是时间和空间的权衡——太高会加剧哈希碰撞，太低会浪费空间。扩容时 rehash，所有元素需要重新分配位置。', 3, '2026-04-17 10:11:00', '2026-04-17 10:11:00', TRUE),
    (104, 100, 'USER', 'ConcurrentHashMap 和 HashMap 的区别是什么？', 4, '2026-04-17 10:25:00', '2026-04-17 10:25:00', TRUE),
    (105, 100, 'ASSISTANT', 'ConcurrentHashMap 是线程安全的 HashMap。JDK1.7 使用分段锁（Segment + HashEntry），JDK1.8 改为 CAS + synchronized 实现，对每个桶单独加锁，并发度更高。HashMap 不是线程安全的，并发操作可能导致死循环或数据丢失。', 5, '2026-04-17 10:26:00', '2026-04-17 10:26:00', TRUE),
    (106, 100, 'USER', '好的，明白了。', 6, '2026-04-17 10:35:00', '2026-04-17 10:35:00', TRUE),
    (107, 100, 'ASSISTANT', '很高兴能帮到你！如需更多关于 HashMap 或面试准备的问题，随时提问。', 7, '2026-04-17 10:35:00', '2026-04-17 10:35:00', TRUE),

    (108, 101, 'USER', 'MySQL InnoDB 的 MVCC 是怎么工作的？', 0, '2026-04-18 14:00:00', '2026-04-18 14:00:00', TRUE),
    (109, 101, 'ASSISTANT', 'InnoDB 的 MVCC 通过三个机制实现：1）每行有两个隐藏列 DB_TRX_ID（最近修改的事务ID）和 DB_ROLL_PTR（指向 Undo Log 的指针）；2）Undo Log 形成版本链；3）ReadView 在快照读时生成，判断数据可见性。如果行的 trx_id 在 ReadView 的活跃事务列表中，就通过 Roll Ptr 读取 Undo Log 中的历史版本。', 1, '2026-04-18 14:01:00', '2026-04-18 14:01:00', TRUE),
    (110, 101, 'USER', 'ReadView 在什么时机生成？', 2, '2026-04-18 14:10:00', '2026-04-18 14:10:00', TRUE),
    (111, 101, 'ASSISTANT', 'ReadView 在事务执行快照读（SELECT）时生成。ReadView 包含：m_ids（活跃事务ID列表）、min_trx_id（活跃事务ID下限）、max_trx_id（创建ReadView时最大事务ID）、creator_trx_id（当前事务ID）。在 REPEATABLE READ 隔离级别下，整个事务中ReadView不变，在 READ COMMITTED 下每次快照读都会重新生成。', 3, '2026-04-18 14:11:00', '2026-04-18 14:11:00', TRUE),
    (112, 101, 'USER', '那么 RC 和 RR 隔离级别下 MVCC 表现有何不同？', 4, '2026-04-18 14:20:00', '2026-04-18 14:20:00', TRUE),
    (113, 101, 'ASSISTANT', '在 READ COMMITTED 下，每次 SELECT 都会生成新的 ReadView，所以可以看到其他已提交事务的修改。在 REPEATABLE READ 下，整个事务中复用同一个 ReadView，所以同一事务的多次 SELECT 结果一致，这就是幻读问题的根源。', 5, '2026-04-18 14:21:00', '2026-04-18 14:21:00', TRUE),

    (114, 102, 'USER', 'Redis 穿透、击穿、雪崩三个问题有什么区别？', 0, '2026-04-16 09:00:00', '2026-04-16 09:00:00', TRUE),
    (115, 102, 'ASSISTANT', '穿透：缓存和数据库都没有数据，请求直达数据库，通常是恶意攻击或查询不存在的数据，解决方案是布隆过滤器或缓存空值。击穿：热点 Key 过期瞬间大量请求直接打到数据库，解决方案是分布式锁或热点数据永不过期。雪崩：大量 Key 同时过期或 Redis 宕机，解决方案是随机 TTL + 多级缓存 + Redis 高可用集群。', 1, '2026-04-16 09:01:00', '2026-04-16 09:01:00', TRUE),
    (116, 102, 'USER', 'Redis 的持久化机制选 RDB 还是 AOF？', 2, '2026-04-16 09:15:00', '2026-04-16 09:15:00', TRUE),
    (117, 102, 'ASSISTANT', '推荐同时开启 RDB 和 AOF，用 AOF 作为数据安全的主要保障，AOF 策略设置 everysec 平衡性能和安全。RDB 作为快速恢复的备份，适合大规模数据迁移。如果对数据安全要求极高（如金融场景），只使用 AOF always 模式。需要注意的是，AOF 重写会占用资源，需要合理配置。', 3, '2026-04-16 09:16:00', '2026-04-16 09:16:00', TRUE)
ON CONFLICT DO NOTHING;
