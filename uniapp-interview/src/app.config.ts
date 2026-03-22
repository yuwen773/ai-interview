export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/upload/index',
    'pages/resume-detail/index',
    'pages/interview-config/index',
    'pages/interview/index',
    'pages/interview-report/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'AI面试助手',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#3B82F6',
    borderStyle: 'white',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
      },
      {
        pagePath: 'pages/interview/index',
        text: '面试',
      },
    ],
  },
});
