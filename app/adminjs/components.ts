import { ComponentLoader } from 'adminjs';

const componentLoader = new ComponentLoader();

const Components = {
    LogViewer: componentLoader.add('LogViewer', './Components/LogViewer'),
};

export { componentLoader, Components };
