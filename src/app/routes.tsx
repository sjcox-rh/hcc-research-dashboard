import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Dashboard } from '@app/Dashboard/Dashboard';
import { EpicDetailPage } from '@app/EpicDetail/EpicDetailPage';
import { ResearchResources } from '@app/ResearchResources/ResearchResources';
import { ResearchProcess } from '@app/ResearchProcess/ResearchProcess';
import { NotFound } from '@app/NotFound/NotFound';

export interface IAppRoute {
  label?: string; // Excluding the label will exclude the route from the nav sidebar in AppLayout
  /* eslint-disable @typescript-eslint/no-explicit-any */
  element: React.ReactElement;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  exact?: boolean;
  path: string;
  title: string;
  routes?: undefined;
}

export interface IAppRouteGroup {
  label: string;
  routes: IAppRoute[];
}

export type AppRouteConfig = IAppRoute | IAppRouteGroup;

const routes: AppRouteConfig[] = [
  {
    element: <Dashboard />,
    exact: true,
    label: 'Dashboard',
    path: '/',
    title: 'HCC Research | ConsolePuffs',
  },
  {
    element: <ResearchProcess />,
    exact: true,
    label: 'Research process',
    path: '/research/process',
    title: 'Research Process | ConsolePuffs',
  },
  {
    element: <EpicDetailPage />,
    exact: true,
    path: '/research/epic/:epicKey',
    title: 'Epic | ConsolePuffs',
  },
  {
    element: <ResearchResources />,
    exact: true,
    label: 'Research Resources',
    path: '/support',
    title: 'Research Resources | ConsolePuffs',
  },
];

const flattenedRoutes: IAppRoute[] = routes.reduce(
  (flattened, route) => [...flattened, ...(route.routes ? route.routes : [route])],
  [] as IAppRoute[],
);

const AppRoutes = (): React.ReactElement => (
  <Routes>
    {flattenedRoutes.map(({ path, element }, idx) => (
      <Route path={path} element={element} key={idx} />
    ))}
    <Route element={<NotFound />} />
  </Routes>
);

export { AppRoutes, routes };
