
/**
 * Created by balank on 23/02/2017.
 */
var angular = require('angular');
var css = require('../css/global.scss');
var styles = require('../data/map-styles.json');
var mapsConfig = require('../data/map-config.json');
var toolTipHtml = require('../templates/map-tooltip.html');

mapsConfig.NSW.styles = styles;
mapsConfig.QLD.styles = styles;

var mapApp = angular.module('mapApp', []);

mapApp.controller('MapController', ['$rootScope', '$scope', '$timeout', '$location', function ($rootScope, $scope, $timeout, $location) {

    console.log('MapController::$location.path : ' , $location.path());

    $scope.activeMapConfig = null;

    $scope.mapError = null;

    $scope.$on('$locationChangeSuccess', function (location) {
        console.log('MapController::$locationChangeSuccess : ' , $location.path());
        var url = $location.path().split('/');
        var state = url[1] || '';
        var area = url[2] || 'LOCAL';

        if (mapsConfig[state.toUpperCase()]) {
            console.log('state = ', state, 'area = ', area);
            $scope.mapError = null;
            $scope.activeMapConfig = mapsConfig[state.toUpperCase()];
            $scope.activeMapConfig.activeArea = area.toUpperCase();
            console.log('MapController::set activeArea to', area);
        } else {
            $scope.mapError = 'No state config found';
        }

    });

    return {

        showMetro: function (config) {
            console.log('showMetro clicked');
            var urlPath = config.state + '/' + config.metro.code;
            $location.path(urlPath);
        },

        showLocal: function (config) {
            console.log('showLocal clicked');
            var urlPath = config.state + '/local';
            $location.path(urlPath);
        }

    }

}]);

mapApp.factory('mapService', ['$timeout', function ($timeout) {

    var mapCallbacks = [],
        pubCallbacks = [],
        selectMapCallbacks = [],
        selectPubCallbacks = [],
        searchMapCallbacks = [],
        getPubFactCb,
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

        selectMapPublication: function (featureId, isSearchInput) {
            selectPubCallbacks.forEach(function(cb) {
                cb(featureId, isSearchInput);
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
        },

        getPublicationFactById: function (featureId) {
            return getPubFactCb(featureId);
        },

        onGetPublicationFactById: function (cb) {
            getPubFactCb = cb;
        }

    }

}]);

mapApp.component('mapComponent', {

    transclude: true,

    templateUrl: function ($element, $attrs) {
        return $attrs.templateUrl || 'templates/map-component.html';
    },

    bindings: {
        config: '<'
    },

    controller: ['$scope', 'mapService', function ($scope, mapService) {

        var initConfig = null;

        this.$postLink = function () {
            console.log('mapComponent::$postLink...');
            $scope.config = angular.merge(mapService.defaults, this.config);
            mapService.loadMap($scope.config);
        };

        this.$doCheck =  function (changes) {
            console.log('mapComponent::$doCheck...-----', this.config.activeArea);
            if (!initConfig) {
                initConfig = angular.copy(this.config);
            }
            if (initConfig.state !== this.config.state ||initConfig.activeArea !== this.config.activeArea) {
                console.log('mapComponent::$doCheck...----------------CHANGED', initConfig.state, '===', this.config.state);
                initConfig = angular.copy(this.config);
                $scope.config = angular.merge(mapService.defaults, this.config);
                mapService.loadMap($scope.config);
            }
        };

    }]

});

mapApp.directive('mapArea', ['mapService', '$compile',  function (mapService, $compile) {

    var map;

    return {

        restrict: 'AEC',

        scope: {},

        transclude: true,

        templateUrl: function ($element, $attrs) {
            return $attrs.templateUrl || 'templates/map-area.html';
        },

        link: function ($scope, $element, attr, controller) {
            var infoWindow,
                infoWindowEvt,
                mapClickEvt;

            $scope.activeMapConfig = {};

            $scope.facts = {};

            $scope.$watch('activeMapConfig.activeArea', function (activeArea) {
               console.log('mapArea::$watch--------------------------activeArea is ', activeArea);
                /*if (activeArea === 'LOCAL') {
                    $element.removeClass('hide').addClass('open');
                } else {
                    $element.removeClass('open').addClass('hide');
                }*/
            });

            mapService.onLoadMap(function (config) {
                console.log('mapArea: on Load map');

                $scope.activeMapConfig = config;

                if (config.activeArea.toUpperCase() === 'LOCAL') {
                    $element.removeClass('hide').addClass('open');
                } else {
                    $element.removeClass('open').addClass('hide');
                }

                map = controller.renderMap(config, $element[0].querySelector('.geo-map-data'));

                infoWindow = new google.maps.InfoWindow();

                controller.loadGeoJson(map, config.geoJson);

                mapClickEvt = map.data.addListener('click', function(event) {
                    var clearSearchInput = true;
                    var featureId = event.feature.getId();
                    map.data.revertStyle();
                    infoWindow.close();
                    controller.selectMapFeature(event.feature);
                    controller.selectClosestMapFeatures(featureId);
                    mapService.selectMapPublication(featureId, clearSearchInput);
                });

                infoWindowEvt = map.data.addListener('mouseover', function(event) {
                    $scope.facts =  mapService.getPublicationFactById(event.feature.getId());
                    var template = angular.element(toolTipHtml);
                    var linkFn = $compile(template);
                    var element = linkFn($scope);
                    infoWindow.setContent(element[0]);
                    $scope.$apply();

                    infoWindow.setPosition({
                        lat: event.feature.getProperty('centroid')[1],
                        lng: event.feature.getProperty('centroid')[0]
                    });
                    infoWindow.open(map);
                }.bind(this));

                google.maps.event.addListener(infoWindow, 'closeclick', function (event) {
                    google.maps.event.removeListener(infoWindowEvt);
                });

            }.bind(this));

            mapService.onSelectMapFeature(function (feature) {
                map.data.revertStyle();
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
                    map.data.overrideStyle(feature, { zIndex:99, strokeColor: 'red', strokeWeight: 1 });
                    if (panTo) {
                        var lng = feature.getProperty('centroid')[0];
                        var lat = feature.getProperty('centroid')[1];
                        map.panTo(new google.maps.LatLng(lat, lng));
                    }
                },

                selectClosestMapFeatures: function (featureId) {
                    angular.forEach($scope.activeMapConfig.publicationsMapping, function (pubMapping) {
                        if (pubMapping.id === featureId) {
                            angular.forEach(pubMapping.closest, function (closestPubId) {
                                var feature = map.data.getFeatureById(closestPubId);
                                map.data.overrideStyle(feature, { zIndex:99, strokeColor: 'green', strokeWeight: 1 })
                            }.bind(this))
                        }
                    }.bind(this));
                },

                setMapSearchLocation: function (place) {
                    var selectedFeatures = [],
                        featureIds = [];
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
                        var points = [],
                            shape;

                        feature.getGeometry().forEachLatLng(function(latLng) {
                            points.push(latLng);
                        }.bind(this));

                        shape = new google.maps.Polygon({ paths: points });
                        if(google.maps.geometry.poly.containsLocation(place.geometry.location, shape)) {
                            selectedFeatures.push(feature);
                            featureIds.push(feature.getId());
                        }
                    }.bind(this));

                    console.log('contains [', selectedFeatures.length, ']location ----');

                    map.data.revertStyle();
                    angular.forEach(selectedFeatures, function (feature) {
                        this.selectMapFeature(feature);
                        mapService.selectMapPublication(featureIds);
                    }.bind(this));
                }

            };

        }]

    }
}]);

mapApp.directive('publicationsList', ['mapService', '$timeout', '$location', function (mapService, $timeout, $location) {

    return {

        restrict: 'AEC',

        transclude: true,

        isInit: false,

        templateUrl: function ($element, $attrs) {
            return $attrs.templateUrl || 'templates/publications-list.html';
        },

        link: function ($scope, $element, attr, controller) {
            var searchOpts = { componentRestrictions: { country: 'au' }, types: ['geocode'] };
            var search;

            $scope.searchedPlace = null;

            $scope.isNewStateSearch = false;

            $scope.pubFacts = [];

            $scope.isPublicationListOpen = true;

            $scope.isPublicationDataOpen = true;

            mapService.onLoadMap(function (config) {
                console.log('publicationsList: on Load map');
                if (!this.isInit) {
                    search = new google.maps.places.Autocomplete($element[0].querySelector('.pac-input'), searchOpts);
                    google.maps.event.addListener(search, 'place_changed', controller.searchMap.bind(this, search));
                    this.isInit = true;
                }
            });

            $scope.onClickPublicationLink = function (publication) {
                var featureIds = [publication.id];
                controller.clearSearchInput();
                controller.selectPublication(featureIds, false);
                mapService.selectMapFeature(publication);
            };

            $scope.togglePublications = function () {
                $scope.isPublicationOpen = !$scope.isPublicationOpen;
            };

            mapService.onLoadPublications(function (publications) {
                controller.getAllPublicationFacts().then(function () {
                    controller.addPublications(publications);
                });
            }.bind(this));

            mapService.onSelectMapPublication(function (featureId, clearSearchInput) {
                if (clearSearchInput) {
                    controller.clearSearchInput();
                }
                controller.selectPublication(featureId, true);
            });

            mapService.onGetPublicationFactById(function (featureId) {
                var pubs = controller.getPublicationFact(featureId);
                return pubs;
            });
        },

        controller: ['$scope', '$timeout', '$http', '$q', '$element',  function ($scope, $timeout, $http, $q, $element) {

            return {

                searchMap: function (search) {
                    var state = [],
                        place = search.getPlace();
                    if(!place || !place.id) {
                        console.warn('[FAIL] No place found..');
                        return;
                    }
                    $scope.searchedPlace = place;

                    state = place.address_components.filter(function(address){
                        return address.types[0] === 'administrative_area_level_1' && address.types[1] === 'political';
                    });

                    if (state.length > 0 && state[0].short_name !== $scope.activeMapConfig.state) {
                        //TODO pass search url?
                        console.log('changing location search -------------- to ', state[0].short_name);
                        $location.url(state[0].short_name + '/local');
                        $scope.isNewStateSearch = true;
                        $scope.$apply();
                    } else {
                        $scope.isNewStateSearch = false;
                    }

                    mapService.searchMapLocation(place);
                },

                addPublications: function (data) {
                    $scope.publications = data.features.map(function(feature) {
                        return {
                            id: feature.id,
                            properties: feature.properties,
                            isSelected: false,
                            facts: []
                        }
                    });
                    if ($scope.isNewStateSearch) {
                        //TODO:refactor
                        $timeout(function () {
                            mapService.searchMapLocation($scope.searchedPlace);
                        }, 300);
                    }

                },

                selectPublication: function (featureIds, apply) {
                    console.log('featureIds::', featureIds);
                    angular.forEach($scope.publications, function (pubObj) {
                        pubObj.isSelected = featureIds.indexOf(pubObj.id) !== -1 ? true : false;
                        pubObj.facts = this.getPublicationFact(pubObj.id);
                    }.bind(this));

                    if (apply) {
                        $scope.$apply();
                    }
                },

                getAllPublicationFacts: function () {
                    var state = $scope.activeMapConfig.state;
                    var factUrl = 'data/' + state.toLowerCase() + '-facts.json';
                    return $q(function(resolve, reject) {
                        $http.get(factUrl).then(function (response) {
                            $scope.pubFacts = response.data;
                            resolve(response.data);
                        }, function (err) {
                            console.log('[ERROR] No data loaded: ', err);
                            reject(err);
                        });
                    });
                },

                clearSearchInput: function () {
                    $scope.searchedPlace = null;
                    $element[0].querySelector('.pac-input').value = '';
                },

                getPublicationFact: function (featureId) {
                    var facts = $scope.pubFacts.filter(function (factObj) {
                        return factObj.id === featureId;
                    }).map(function (filteredObj) {
                        return filteredObj.facts
                    });
                    return facts[0] || {}
                }

            };

        }]

    }

}]);

mapApp.directive('metroArea', ['mapService', '$location', function (mapService, $location) {

    return {
        restrict: 'AEC',

        transclude: true,

        scope: {},

        templateUrl: function ($element, $attrs) {
            return $attrs.templateUrl || 'templates/metro-area.html';
        },

        link: function ($scope, $element, attr, controller) {
            console.log('metroArea:linkFn--------------------');

            $scope.activeMapConfig = {};

            mapService.onLoadMap(function (config) {
                console.log('metroArea: on Load map');
                $scope.activeMapConfig = config;

                if (config.activeArea.toUpperCase() === 'LOCAL') {
                    $element.removeClass('open').addClass('hide');
                } else {
                    $element.removeClass('hide').addClass('open');
                }

            }.bind(this));

        },

        controller: ['$scope', function ($scope) {
            console.log('metroArea:controller called...');
        }]
    }

}]);