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
    navigationBarTitleText: 'AI Interview Coach',
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
        text: 'Home',
      },
      {
        pagePath: 'pages/resume-list/index',
        text: 'Resumes',
      },
      {
        pagePath: 'pages/interview-history/index',
        text: 'History',
      },
      {
        pagePath: 'pages/profile/index',
        text: 'Profile',
      },
    ],
  },
});
