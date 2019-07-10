import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import setHighlightedDistrict from '../../redux/actions/district';
import { setAddressTitle, setAddressUnits } from '../../redux/actions/address';
import { getLocaleString } from '../../redux/selectors/locale';
import styles from './styles';
import AddressView from './AddressView';

const mapStateToProps = (state) => {
  const map = state.mapRef.leafletElement;
  const getLocaleText = textObject => getLocaleString(state, textObject);
  const highlightedDistrict = state.districts.highlitedDistrict;
  const { navigator, breadcrumb } = state;
  const addressState = state.address;
  const { mobile } = state.user;
  return {
    map,
    getLocaleText,
    highlightedDistrict,
    navigator,
    breadcrumb,
    addressState,
    mobile,
  };
};


export default withRouter(withStyles(styles)(injectIntl(connect(
  mapStateToProps,
  { setHighlightedDistrict, setAddressTitle, setAddressUnits },
)(AddressView))));
