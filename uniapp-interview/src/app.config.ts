export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/resume-list/index',
    'pages/interview-history/index',
    'pages/profile/index',
    'pages/upload/index',
    'pages/resume-detail/index',
    'pages/interview-config/index',
    'pages/interview/index',
    'pages/interview-report/index',
    'pages/growth-curve/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '面试练习',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#7A7E83',
    selectedColor: '#3B82F6',
    borderStyle: 'black',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
      },
      {
        pagePath: 'pages/resume-list/index',
        text: '简历库',
      },
      {
        pagePath: 'pages/interview-history/index',
        text: '面试记录',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ],
  },
});
