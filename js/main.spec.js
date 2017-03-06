/**
 * Created by balank on 1/03/2017.
 */
// Be descriptive with titles here. The describe and it titles combined read like a sentence.

describe('MapApp', function() {

    var module = angular.mock.module;

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
        QLD: {
            state: 'QLD',
            geoJson: 'data/qld.json',
            center: { lat: -27.470125, lng: 153.021072 },styles: styles },
            styles: styles
    };

    beforeEach(module('mapApp'));

    /*beforeEach(module(function($locationProvider) {
        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix('!');
    }));*/

    /*it('has a dummy spec to test 2 + 2', function() {
        // An intentionally failing test. No code within expect() will never equal 4.
        expect(1 + 1).toEqual(4);
        //passing test
        expect(2 + 2).toEqual(4);
    });*/

    var $controller,
        $scope,
        $location,
        $window;

    beforeEach(inject(function(_$controller_, $rootScope, _$location_){
        console.log('before each inject......');
        $controller = _$controller_;
        $scope = $rootScope.$new();
    }));

    describe('MapController scope', function () {

        it('should have test obj and activeMapConfig as null after INIT', function () {
            var controller = $controller('MapController', {
                $scope: $scope
            });
            expect($scope.test).toEqual({str1:'----', str2: '----'});
            expect($scope.activeMapConfig).toEqual(null);
        });

        it('should have activeMapConfig set to NSW when location.hash is #NSW', inject(function ($location, $rootScope) {
            var controller = $controller('MapController', {
                $scope: $scope
            });
            //$location.hash('nsw'); //this is version <1.6
            $location.search('state', 'NSW');
            $rootScope.$apply();
            expect($scope.activeMapConfig).toEqual(mapsConfig.NSW);
        }));

        it('should have activeMapConfig set to QLD when location.hash is #QLD', inject(function ($location, $rootScope) {
            var controller = $controller('MapController', {
                $scope: $scope
            });
            //$location.hash('qld');//this  is version <1.6
            $location.search('state', 'QLD');
            $rootScope.$apply();
            expect($scope.activeMapConfig).toEqual(mapsConfig.QLD);
        }));
    });


});


describe('MapService', function() {

    var module = angular.mock.module;
    var mapService;
    var $timeout;
    var defaults = {
        zoom: 10,
        center: { lat: -27.470125, lng: 153.021072 },
        disableDefaultUI: true,
        zoomControl: true,
        styles: [],
        geoJson: ''
    };

    beforeEach(module('mapApp'));

    beforeEach(inject(function(_$timeout_, _mapService_){
        console.log('before each inject......in MapService');
        mapService = _mapService_;
        $timeout = _$timeout_;
    }));

    afterEach(function() {
        //jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    it('should have default map objects', function () {
        expect(mapService.defaults).toEqual(defaults);
    });

    it('should asynchronously invoke onLoadMap callback after window.google is present', function (done) {
        var cb = false;
        var obj = {
            fn: function (options) {
                cb = true;
            }
        };
        mapService.onLoadMap(obj.fn);
        mapService.loadMap(defaults);
        expect(cb).toBeFalsy();
        spyOn(obj, 'fn');

        setTimeout(function () {
            //Delay loading of window.google by .5 seconds
            window.google = {};
        }, 500);

        setTimeout(function() {
            //Run assertions after google obj is loaded after .5 seconds
            $timeout.flush();
            expect(cb).toBeTruthy();
            done();
        }, 600);


    });

    it('should invoke onLoadPublications callback when loadPublications is triggered', function () {
        var pubs = ['test'],
            obj = {
                fn: function () {
                    return true;
                }
            };
        spyOn(obj, 'fn');
        mapService.onLoadPublications(obj.fn);
        mapService.loadPublications(pubs);
        expect(obj.fn).toHaveBeenCalledWith(pubs);
    });

    it('should invoke onSelectMapPublication callback when selectMapPublication is triggered', function () {
        var pubs = ['test'],
            obj = {
                fn: function () {
                    return true;
                }
            };
        spyOn(obj, 'fn');
        mapService.onSelectMapPublication(obj.fn);
        mapService.selectMapPublication(pubs);
        expect(obj.fn).toHaveBeenCalledWith(pubs);
    });

    it('should invoke onSelectMapFeature callback when selectMapFeature is triggered', function () {
        var pubs = {},
            panTo = 'panTo',
            obj = {
                fn: function () {
                    return true;
                }
            };
        spyOn(obj, 'fn');
        mapService.onSelectMapFeature(obj.fn);
        mapService.selectMapFeature(pubs, panTo);
        expect(obj.fn).toHaveBeenCalledWith(pubs, panTo);
    });

    it('should invoke onSearchMapLocation callback when searchMapLocation is triggered', function () {
        var pubs = ['test'],
            obj = {
                fn: function () {
                    return true;
                }
            };
        spyOn(obj, 'fn');
        mapService.onSearchMapLocation(obj.fn);
        mapService.searchMapLocation(pubs);
        expect(obj.fn).toHaveBeenCalledWith(pubs);
    });

});