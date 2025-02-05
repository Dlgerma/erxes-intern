module.exports = {
  srcDir: __dirname,
  name: 'polarissync',
  port: 3017,
  scope: 'polarissync',
  exposes: {
    './routes': './src/routes.tsx',
    "./customerSidebar": "./src/CustomerSidebar.tsx",
    './extendSystemConfig': './src/components/Configs.tsx'
  },
  routes: {
    url: 'http://localhost:3017/remoteEntry.js',
    scope: 'polarissync',
    module: './routes'
  },
  extendSystemConfig: './extendSystemConfig',
  polarisInfo: './customerSidebar',
  menus:[],
  customerRightSidebarSection: [
    {
      text: "customerSection",
      component: "./customerSidebar",
      scope: "polarissync",
    },
  ],

};
