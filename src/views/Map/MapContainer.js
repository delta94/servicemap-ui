/* eslint-disable max-len, global-require */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getMapType } from '../../redux/selectors/map';
import getDistricts from '../../redux/selectors/district';
import { fetchDistrictsData } from '../../redux/actions/district';
import MapView from './components/MapView';
import { getSelectedUnit } from '../../redux/selectors/unit';
import { getLocaleString } from '../../redux/selectors/locale';
import CreateMap from './utils/createMap';
import { mapOptions } from './constants/mapConstants';
import fetchStops from './utils/fetchStops';

class MapContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialMap: null,
      transitStops: [],
    };
  }

  componentDidMount() {
    this.initiateMap();
    const mockPosition = {
      lat: 60.1715997,
      lng: 24.9381021,
    };
    this.fetchMapDistricts(mockPosition);
  }

  initiateMap = () => {
    const initialMap = CreateMap('servicemap');
    this.setState({ initialMap });
  }

  fetchMapDistricts = (position) => {
    const { fetchDistrictsData } = this.props;
    fetchDistrictsData(position);
  }

  fetchTransitStops = (bounds) => {
    const { locale } = this.props;
    fetchStops(bounds)
      .then(((data) => {
        const stops = data[0].data.stopsByBbox;
        const subwayStations = stops.filter(stop => stop.patterns[0].route.mode === 'SUBWAY');

        // Remove subwaystations from stops list since they will be replaced with subway entrances
        const filteredStops = stops.filter(stop => stop.patterns[0].route.mode !== 'SUBWAY');

        const entrances = data[1].results;

        // Add subway entrances to the list of stops and give them proper schedules
        entrances.forEach((entrance) => {
          const closest = {
            distance: null,
            stop: null,
          };
          // Find the subwaystation closest to the entrance
          subwayStations.forEach((stop) => {
            const distance = Math.sqrt(
              ((stop.lat - entrance.location.coordinates[1]) ** 2)
              + ((stop.lon - entrance.location.coordinates[0]) ** 2),
            );
            if (!closest.distance || distance < closest.distance) {
              closest.distance = distance;
              closest.stop = stop;
            }
          });
          // Get the same station's stop for other direction (west/east)
          const otherStop = subwayStations.find(
            station => station.name === closest.stop.name && station.gtfsId !== closest.stop.gtfsId,
          );

          // Combine the arrival schedules to add them to the subway entrance info
          let arrivalTimes = [
            ...closest.stop.stoptimesWithoutPatterns,
            ...otherStop.stoptimesWithoutPatterns,
          ];

          // Sort arrivals by time and shorten the list
          arrivalTimes.sort(
            (a, b) => (a.realtimeArrival + a.serviceDay) - (b.realtimeArrival + b.serviceDay),
          );
          arrivalTimes = arrivalTimes.slice(0, 5);

          // Create a new stop from the entrance, give it the arrival schedule of the corresponding station and add it to the list of stops
          const newStop = {
            gtfsId: entrance.id,
            lat: entrance.location.coordinates[1],
            lon: entrance.location.coordinates[0],
            name: entrance.name[locale],
            patterns: closest.stop.patterns,
            stoptimesWithoutPatterns: arrivalTimes,
          };
          filteredStops.push(newStop);
        });
        this.setState({ transitStops: filteredStops });
      }));
  }

  clearTransitStops = () => {
    this.setState({ transitStops: [] });
  }

  render() {
    const {
      mapType, districts, highlightedUnit, getLocaleText,
    } = this.props;
    let { unitList } = this.props;

    if (highlightedUnit) {
      unitList = [highlightedUnit];
    }

    const { initialMap, transitStops } = this.state;
    if (initialMap) {
      return (
        <MapView
          key={mapType ? mapType.crs.code : initialMap.crs.code}
          mapBase={mapType || initialMap}
          unitList={unitList}
          districtList={districts}
          mapOptions={mapOptions}
          fetchTransitStops={this.fetchTransitStops}
          clearTransitStops={this.clearTransitStops}
          transitStops={transitStops}
          getLocaleText={textObject => getLocaleText(textObject)}
          // TODO: think about better styling location for map
          style={{ flex: '1 0 auto' }}
        />
      );
    }
    return null;
  }
}
// Listen to redux state
const mapStateToProps = (state) => {
  const { units } = state;
  const {
    data,
  } = units;
  const mapType = getMapType(state);
  const districts = getDistricts(state);
  const highlightedUnit = getSelectedUnit(state);
  const getLocaleText = textObject => getLocaleString(state, textObject);
  // const unitList = getUnitList(state);
  return {
    mapType,
    districts,
    state,
    highlightedUnit,
    getLocaleText,
    unitList: data,
    // unitList,
  };
};

export default connect(
  mapStateToProps,
  // TODO: remove redux action from this class
  { fetchDistrictsData },
)(MapContainer);


// Typechecking
MapContainer.propTypes = {
  mapType: PropTypes.oneOfType([PropTypes.objectOf(PropTypes.any), PropTypes.string]),
  unitList: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.array])),
  locale: PropTypes.string,
  districts: PropTypes.arrayOf(PropTypes.object),
  highlightedUnit: PropTypes.objectOf(PropTypes.any),
  fetchDistrictsData: PropTypes.func.isRequired,
  getLocaleText: PropTypes.func.isRequired,
};

MapContainer.defaultProps = {
  mapType: '',
  unitList: [],
  locale: 'fi',
  districts: {},
  highlightedUnit: null,
};
