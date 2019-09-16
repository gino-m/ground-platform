/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import './index.css';
import {connect} from 'react-redux';
import {compose, withProps} from 'recompose';
import {getActiveProject, getMapFeatures} from '../../datastore.js';
import {getFeaturePath, featurePath} from '../../route.js';
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
} from 'react-google-maps';
import googleMapsConfig from '../../.google-maps-config.js';
import PropTypes from 'prop-types';
import { matchPath } from "react-router";

class GndMap extends React.Component {
  // https://github.com/google-map-react/google-map-react/blob/master/API.md
  constructor(props) {
    super(props);
    const gndMap = this;
    this.map = new Promise((r) => {
      gndMap.resolveMap = r;
    });
  }

  getSelectedFeatureIdFromUrl() {
    const match = matchPath(this.props.location.pathname, featurePath);
    if (!match) {
      return null;
    }
    return match.params.featureId;
  }

  onMapLoaded(map, maps) {
    this.resolveMap(map);
  }

  getIcon(project, feature, isSelected) {
    // TODO: Preload icons on project change.
    // TODO: Increase size.
    const featureTypeId = feature.featureTypeId;
    const defaultColor = '#ff9131';
    const color = (project &&
                  project.featureTypes &&
                  project.featureTypes[featureTypeId] &&
                  project.featureTypes[featureTypeId].defaultStyle &&
                  project.featureTypes[featureTypeId].defaultStyle.color)
                  || defaultColor;
    return {
      path: `M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,
             1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,
             22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z`,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 0,
      scale: isSelected ? 1.5 : 1,
    };
  }

  onMarkerClick(projectId, featureId) {
    var url = getFeaturePath(projectId, featureId);
    this.props.history.push(url);
  }

  renderFeature(markers, projectId, project, featureId, feature, isSelected) {
    if (!project || !feature || !feature.center) {
      return markers;
    }
    const pos = feature.center;
    markers.push(
        <Marker
          key={featureId}
          position={{lat: pos.latitude, lng: pos.longitude}}
          icon={this.getIcon(project, feature, isSelected)}
          onClick={this.onMarkerClick.bind(this, projectId, featureId)}
        />
    );
    return markers;
  }

  render() {
    const {projectId, project, features} = this.props;
    const selectedFeatureId = this.getSelectedFeatureIdFromUrl();
    return (
      <GoogleMap
        bootstrapURLKeys={{key: googleMapsConfig.apiKey}}
        onGoogleApiLoaded={({map, maps}) => this.onMapLoaded(map, maps)}
        defaultCenter={this.props.center}
        defaultZoom={this.props.zoom}
        defaultMapTypeId="hybrid"
        defaultOptions={{
          disableDefaultUI: true,
          zoomControl: true,
          scrollwheel: true,
        }}
      >
        {features &&
          Object.keys(features).reduce((markers, featureId) =>
            this.renderFeature(markers,
                projectId,
                project,
                featureId,
                features[featureId],
                featureId === selectedFeatureId
            ),
          []
          )}
      </GoogleMap>
    );
  }
}

const mapStateToProps = (store, props) => ({
  project: getActiveProject(store),
  features: getMapFeatures(store),
});

const mapsApiUrl =
  'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing';

const enhance = compose(
    connect(mapStateToProps),
    withProps({
      googleMapURL: `${mapsApiUrl}&key=${googleMapsConfig.apiKey}`,
      loadingElement: <div id="loading" />,
      containerElement: <div id="map-container" />,
      mapElement: <div id="map" />,
      center: {
        lat: 0,
        lng: 0,
      },
      zoom: 3,
    }),
    withScriptjs,
    withGoogleMap
);

GndMap.propTypes = {
  projectId: PropTypes.string,
  project: PropTypes.object,
  features: PropTypes.object,
  center: PropTypes.object,
  zoom: PropTypes.number,
};

export default enhance(GndMap);
