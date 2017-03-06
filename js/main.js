/**
 * Created by balank on 23/02/2017.
 */
var angular = require('angular');
var css = require('../css/global.css');

var styles = [
    {
        "featureType": "administrative",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#444444"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [
            {
                "color": "#dcdcdc"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.business",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "all",
        "stylers": [
            {
                "saturation": -100
            },
            {
                "lightness": 45
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#B4E4F9"
            },
            {
                "visibility": "on"
            }
        ]
    }
];
var mapsConfig = {
    NSW: {
        state: 'NSW',
        geoJson: 'data/nsw.json',
        center: { lat: -33.8899191578029, lng: 151.20217386753,  },
        styles: styles
    },
    QLD: {state: 'QLD', geoJson: 'data/qld.json', center: { lat: -27.470125, lng: 153.021072 },styles: styles }
};


var mapApp = angular.module('mapApp', []);

mapApp.controller('MapController', ['$rootScope', '$scope', '$timeout', '$location', function ($rootScope, $scope, $timeout, $location) {

    $scope.test = {str1:'----', str2: '----'};

    $scope.isApiLoaded = false;

    $scope.activeMapConfig = null;

    $scope.$on('$locationChangeSuccess', function (location) {
        var state = $location.search().state || 'nsw';
        if (mapsConfig[state.toUpperCase()]) {
            $scope.activeMapConfig = mapsConfig[state.toUpperCase()];
        } else {
            $scope.activeMapConfig = mapsConfig.NSW;
        }
    });


}]);

mapApp.factory('mapService', ['$timeout', function ($timeout) {

    var mapCallbacks = [],
        pubCallbacks = [],
        selectMapCallbacks = [],
        selectPubCallbacks = [],
        searchMapCallbacks = [],
        defaults = {
            zoom: 10,
            center: { lat: -27.470125, lng: 153.021072 },
            disableDefaultUI: true,
            zoomControl: true,
            styles: [],
            geoJson: ''
        };

    return {

        defaults: defaults,

        loadMap: function (config) {
            var google = window.google || null;
            if (google) {
                this.config = config;
                mapCallbacks.forEach(function(cb) {
                    cb(this.config);
                }.bind(this));
            } else {
                $timeout(this.loadMap.bind(this, config), 10);
            }
        },

        onLoadMap: function (cb) {
            if (window.google && this.config) {
                cb(this.config);
            }
            mapCallbacks.push(cb);
        },

        loadPublications: function (publications) {
            pubCallbacks.forEach(function(cb) {
                cb(publications);
            }.bind(this));
            return publications;
        },

        onLoadPublications: function (cb) {
            pubCallbacks.push(cb);
        },

        selectMapPublication: function (publication) {
            selectPubCallbacks.forEach(function(cb) {
                cb(publication);
            }.bind(this));
        },

        onSelectMapPublication: function (cb) {
            selectPubCallbacks.push(cb);
        },

        selectMapFeature: function (feature, flag) {
            selectMapCallbacks.forEach(function(cb) {
                cb(feature, flag);
            }.bind(this));
        },

        onSelectMapFeature: function (fn) {
            selectMapCallbacks.push(fn);
        },

        searchMapLocation: function (place) {
            searchMapCallbacks.forEach(function(cb) {
                cb(place);
            }.bind(this));
        },

        onSearchMapLocation: function (cb) {
            searchMapCallbacks.push(cb);
        }

    }

}]);

mapApp.component('mapComponent', {

    transclude: true,

    templateUrl: function ($element, $attrs) {
        return $attrs.templateUrl || 'templates/map-container.html';
    },

    bindings: {
        config: '<'
    },

    controller: ['$scope', 'mapService', function ($scope, mapService) {

        this.$postLink = function () {
            this.config = angular.merge(mapService.defaults, this.config);
            mapService.loadMap(this.config);
        };

        this.$onChanges =  function (changes) {
            this.config = angular.merge(mapService.defaults, this.config);
            mapService.loadMap(this.config);
        };

    }]

});

mapApp.directive('mapArea', ['mapService', function (mapService) {

    var map;

    return {

        restrict: 'AEC',

        transclude: true,

        templateUrl: function ($element, $attrs) {
            return $attrs.templateUrl || 'templates/map.html';
        },

        link: function ($scope, $element, attr, controller) {

            mapService.onLoadMap(function (options) {
                map = controller.renderMap(options, $element[0].querySelector('.geo-map-data'));
                controller.loadGeoJson(map, options.geoJson);

                map.data.addListener('click', function(event) {
                    controller.selectMapFeature(event.feature);
                    mapService.selectMapPublication(event.feature.getId());
                });

            }.bind(this));

            mapService.onSelectMapFeature(function (feature) {
                var selectedFeature =  map.data.getFeatureById(feature.id);
                controller.selectMapFeature(selectedFeature, 'panTo');
            });

            mapService.onSearchMapLocation(function (place) {
                controller.setMapSearchLocation(place);
            });
        },

        controller: ['$scope', '$http', function ($scope, $http) {

            return {

                marker: null,

                renderMap: function (config, elem) {
                    map = new google.maps.Map(elem, {
                        zoom: config.zoom,
                        center: config.center,
                        disableDefaultUI: config.disableDefaultUI,
                        zoomControl: config.zoomControl,
                        styles: config.styles
                    });
                    return map;
                },

                loadGeoJson: function (map, geoJson) {
                    if (map && map.data && geoJson) {
                        $http.get(geoJson).then(function(response) {
                            map.data.addGeoJson(response.data);
                            map.data.setStyle(function(feature) {
                                var color = feature.getProperty('color');
                                return {
                                    fillColor: color,
                                    fillOpacity: 0.6,
                                    strokeColor: '#949599',
                                    strokeWeight: 0.3
                                };
                            });
                            mapService.loadPublications(response.data);
                        }.bind(this), function (error) {
                            console.warn('[FAIL] Unable to load jsonUrl:', error, '::', geoJson);
                        }.bind(this));
                    } else {
                        console.warn('[FAIL] Unable to load map or jsonUrl:', geoJson);
                    }
                },

                selectMapFeature: function (feature, panTo) {
                    map.data.revertStyle();
                    map.data.overrideStyle(feature, { zIndex:99, strokeColor: 'red', strokeWeight: 1 });
                    if (panTo) {
                        var lng = feature.getProperty('centroid')[0];
                        var lat = feature.getProperty('centroid')[1];
                        map.panTo(new google.maps.LatLng(lat, lng));
                    }
                },

                setMapSearchLocation: function (place) {
                    var selectFeature;
                    var bounds = new google.maps.LatLngBounds();
                    var i = {
                        url: place.icon,
                        size: new google.maps.Size(71, 71),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(25, 25)
                    };

                    if (this.marker) {
                        this.marker.setMap(null);
                    }
                    this.marker = new google.maps.Marker({ map: map, icon: i, position: place.geometry.location });

                    bounds.extend(place.geometry.location);
                    map.panTo(bounds.getCenter());

                    map.data.forEach(function(feature) {
                        var points = [], shape;
                        feature.getGeometry().forEachLatLng(function(l) { points.push(l); });
                        shape = new google.maps.Polygon({ paths: points });
                        if(google.maps.geometry.poly.containsLocation(place.geometry.location, shape)) {
                            selectFeature = feature;
                        }
                    }.bind(this));

                    if (selectFeature) {
                        this.selectMapFeature(selectFeature);
                        mapService.selectMapPublication(selectFeature.getId());
                    } else {
                        map.data.revertStyle();
                        mapService.selectMapPublication('');
                    }
                }

            };

        }]

    }
}]);

mapApp.directive('publicationsList', ['mapService', '$location', function (mapService, $location, $timeout) {

    return {

        restrict: 'AEC',

        transclude: true,

        isInit: false,

        templateUrl: function ($element, $attrs) {
            return $attrs.templateUrl || 'templates/publications-list.html';
        },

        link: function ($scope, $element, attr, controller, $timeout) {
            var searchOpts = { componentRestrictions: { country: 'au' }, types: ['geocode'] };
            var search;

            $scope.activePub = '';

            $scope.activePlace = null;

            $scope.pubFacts = [];

            $scope.activePubFacts= [];

            mapService.onLoadMap(function (options) {
                if (!this.isInit) {
                    search = new google.maps.places.Autocomplete($element[0].querySelector('.pac-input'), searchOpts);
                    google.maps.event.addListener(search, 'place_changed', controller.searchMap.bind(this, search));
                    this.isInit = true;
                }
            });

            $scope.onClickPublicationLink = function (publication) {
                $scope.activePub = publication.id;
                mapService.selectMapFeature(publication);
            };

            mapService.onLoadPublications(function (publications) {
                controller.getAllPublicationFacts();
                controller.addPublications(publications);
            }.bind(this));

            mapService.onSelectMapPublication(function (featureId) {
                controller.selectPublication(featureId);
            });
        },

        controller: ['$scope', '$timeout', '$http', function ($scope, $timeout, $http) {

            return {

                searchMap: function (search) {
                    var state = [],
                        place = search.getPlace();
                    if(!place || !place.id) {
                        console.warn('[FAIL] No place found..');
                        return;
                    }
                    state = place.address_components.filter(function(address){
                        return address.types[0] === 'administrative_area_level_1' && address.types[1] === 'political';
                    });
                    if (state.length > 0 && state[0].short_name !== $scope.activeMapConfig.state) {
                        $location.search('state', state[0].short_name);
                        $scope.activePlace = place;
                    } else {
                        $scope.activePlace = null;
                    }
                    mapService.searchMapLocation(place);
                },

                addPublications: function (data) {
                    $scope.publications = data.features.map(function(feature){
                        return {
                            id: feature.id,
                            properties: feature.properties
                        }
                    });
                    if ($scope.activePlace) {
                        //TODO:refactor
                        $timeout(function () {
                            mapService.searchMapLocation($scope.activePlace);
                        }, 300);
                    }

                },
                selectPublication: function (featureId) {
                    $scope.activePub = featureId;
                    $scope.$apply();
                    this.setPublicationFact(featureId);
                },

                getAllPublicationFacts: function () {
                    var state = $scope.activeMapConfig.state;
                    var factUrl = 'data/' + state.toLowerCase() + '-facts.json';
                    $http.get(factUrl).then(function (response) {
                        $scope.pubFacts = response.data;
                    });
                },

                setPublicationFact: function (featureId) {
                    if ($scope.activePubFacts && $scope.activePubFacts.id !== featureId) {
                        $scope.activePubFacts = null;
                    }
                    angular.forEach($scope.pubFacts, function (factObj) {
                        if (factObj.id === featureId) {
                            $scope.activePubFacts = factObj;
                        }
                    });
                }

            };

        }]

    }
}]);


