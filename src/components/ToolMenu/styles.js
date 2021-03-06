import config from '../../../config';

const menuContainerTop = config.topBarHeight + 1;

export default ({
  menuContainer: {
    position: 'fixed',
    backgroundColor: '#fff',
    right: 1,
    padding: 0,
    margin: 0,
    top: menuContainerTop,
    border: '1px solid blue',
  },
  menuContainerDrawer: {
    backgroundColor: 'inherit',
    position: 'relative',
    margin: 0,
    padding: 0,
  },
  fullWidth: {
    width: '100%',
  },
  menuButton: {
    marginLeft: 'auto',
    justifySelf: 'flex-end',
  },
});
