'use strict';

var Auth = require('../../../../src/js/service/auth'),
    LoginPrivateKeyDownloadCtrl = require('../../../../src/js/controller/login/login-privatekey-download'),
    Email = require('../../../../src/js/email/email'),
    Keychain = require('../../../../src/js/service/keychain');

describe('Login Private Key Download Controller unit test', function() {
    var scope, location, ctrl,
        emailDaoMock, authMock, keychainMock,
        emailAddress = 'fred@foo.com';

    beforeEach(function(done) {
        emailDaoMock = sinon.createStubInstance(Email);
        keychainMock = sinon.createStubInstance(Keychain);
        authMock = sinon.createStubInstance(Auth);

        authMock.emailAddress = emailAddress;

        angular.module('login-privatekey-download-test', ['woServices']);
        angular.mock.module('login-privatekey-download-test');
        angular.mock.inject(function($controller, $rootScope, $location) {
            scope = $rootScope.$new();
            scope.state = {};
            scope.tokenForm = {};
            scope.codeForm = {};
            location = $location;
            ctrl = $controller(LoginPrivateKeyDownloadCtrl, {
                $location: location,
                $scope: scope,
                $routeParams: {},
                auth: authMock,
                email: emailDaoMock,
                keychain: keychainMock
            });
            done();
        });
    });

    afterEach(function() {});

    describe('initialization', function() {
        it('should work', function() {
            expect(scope.step).to.equal(1);
        });
    });

    describe('checkToken', function() {
        var verifyRecoveryTokenStub;

        beforeEach(function() {
            verifyRecoveryTokenStub = sinon.stub(scope, 'verifyRecoveryToken');
        });
        afterEach(function() {
            verifyRecoveryTokenStub.restore();
        });

        it('should fail for empty recovery token', function() {
            scope.tokenForm.$invalid = true;

            scope.checkToken();

            expect(verifyRecoveryTokenStub.calledOnce).to.be.false;
            expect(scope.errMsg).to.exist;
        });

        it('should work', function() {
            verifyRecoveryTokenStub.yields();

            scope.checkToken();

            expect(verifyRecoveryTokenStub.calledOnce).to.be.true;
            expect(scope.step).to.equal(2);
        });
    });

    describe('verifyRecoveryToken', function() {
        var testKeypair = {
            publicKey: {
                _id: 'id'
            }
        };

        it('should fail in keychain.getUserKeyPair', function() {
            keychainMock.getUserKeyPair.yields(new Error('asdf'));

            scope.verifyRecoveryToken();

            expect(scope.errMsg).to.exist;
            expect(keychainMock.getUserKeyPair.calledOnce).to.be.true;
        });

        it('should fail in keychain.downloadPrivateKey', function() {
            keychainMock.getUserKeyPair.yields(null, testKeypair);
            keychainMock.downloadPrivateKey.yields(new Error('asdf'));
            scope.recoveryToken = 'token';

            scope.verifyRecoveryToken();

            expect(scope.errMsg).to.exist;
            expect(keychainMock.getUserKeyPair.calledOnce).to.be.true;
            expect(keychainMock.downloadPrivateKey.calledOnce).to.be.true;
        });

        it('should work', function() {
            keychainMock.getUserKeyPair.yields(null, testKeypair);
            keychainMock.downloadPrivateKey.yields(null, 'encryptedPrivateKey');
            scope.recoveryToken = 'token';

            scope.verifyRecoveryToken(function() {});

            expect(scope.encryptedPrivateKey).to.equal('encryptedPrivateKey');
        });
    });

    describe('decryptAndStorePrivateKeyLocally', function() {
        beforeEach(function() {
            scope.code = '012345';

            scope.encryptedPrivateKey = {
                encryptedPrivateKey: 'encryptedPrivateKey'
            };
            scope.cachedKeypair = {
                publicKey: {
                    _id: 'keyId'
                }
            };
        });

        it('should fail on decryptAndStorePrivateKeyLocally', function() {
            keychainMock.decryptAndStorePrivateKeyLocally.yields(new Error('asdf'));

            scope.decryptAndStorePrivateKeyLocally();

            expect(scope.errMsg).to.exist;
            expect(keychainMock.decryptAndStorePrivateKeyLocally.calledOnce).to.be.true;
        });

        it('should goto /login-existing on emailDao.unlock fail', function(done) {
            keychainMock.decryptAndStorePrivateKeyLocally.yields(null, {
                encryptedKey: 'keyArmored'
            });
            emailDaoMock.unlock.yields(new Error('asdf'));

            scope.goTo = function(location) {
                expect(location).to.equal('/login-existing');
                expect(keychainMock.decryptAndStorePrivateKeyLocally.calledOnce).to.be.true;
                expect(emailDaoMock.unlock.calledOnce).to.be.true;
                done();
            };

            scope.decryptAndStorePrivateKeyLocally();
        });

        it('should goto /account on emailDao.unlock success', function(done) {
            keychainMock.decryptAndStorePrivateKeyLocally.yields(null, {
                encryptedKey: 'keyArmored'
            });
            emailDaoMock.unlock.yields();
            authMock.storeCredentials.yields();

            scope.goTo = function(location) {
                expect(location).to.equal('/account');
                expect(keychainMock.decryptAndStorePrivateKeyLocally.calledOnce).to.be.true;
                expect(emailDaoMock.unlock.calledOnce).to.be.true;
                done();
            };

            scope.decryptAndStorePrivateKeyLocally();
        });
    });

    describe('goTo', function() {
        it('should work', function() {
            sinon.stub(location, 'path', function(path) {
                expect(path).to.equal('/account');
            });

            scope.goTo('/account');
        });
    });
});