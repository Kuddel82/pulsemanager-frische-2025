import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from './Layout';

export const Root: React.FC = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}; 