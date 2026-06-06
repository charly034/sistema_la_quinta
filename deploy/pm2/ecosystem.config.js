const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");

module.exports = {
  apps: [
    {
      name: "la-quinta-api",
      cwd: rootDir,
      script: "npm",
      args: "run start:api",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "la-quinta-web-administracion-preview",
      cwd: rootDir,
      script: "npm",
      args: "run start:web-administracion",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 4174,
      },
    },
    {
      name: "la-quinta-web-central-preview",
      cwd: rootDir,
      script: "npm",
      args: "run start:web-central",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 4177,
      },
    },
    {
      name: "la-quinta-web-pedidos-preview",
      cwd: rootDir,
      script: "npm",
      args: "run start:web-pedidos-la-quinta",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 4173,
      },
    },
    {
      name: "la-quinta-web-preview",
      cwd: rootDir,
      script: "npm",
      args: "run start:web-la-quinta",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 4176,
      },
    },
    {
      name: "fit-and-fresh-web-preview",
      cwd: rootDir,
      script: "npm",
      args: "run start:web-fit-and-fresh",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 4175,
      },
    },
  ],
};
