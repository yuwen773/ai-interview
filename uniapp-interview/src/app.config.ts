export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/upload/index',
    'pages/resume-detail/index',
    'pages/interview/index',
    'pages/interview-report/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'AI面试助手',
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
        pagePath: 'pages/interview/index',
        text: '面试',
      },
    ],
  },
})
