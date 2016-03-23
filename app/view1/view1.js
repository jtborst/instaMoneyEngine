'use strict';

angular.module('myApp.view1', ['ngRoute', "firebase"])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', function ($firebaseObject, $firebaseArray, $http, $log) {

            var workFB = new Firebase("https://instamoney.firebaseio.com/work_queue");
            var notifyFB = new Firebase("https://instamoney.firebaseio.com/notify_queue");
            const ISA_NL = "NL99INGB2348573645";
            const ISA_NL_AUD = "NL77INGB4758476399";
            const ISA_AUS = "AU484744644";
            const DELAY = 5000;


            var notify = $firebaseArray(notifyFB);
            var work = $firebaseArray(workFB);

            window.setInterval(function () {
                if (work.length > 0) {
                    var key = work.$keyAt(0);
                    pickOrder(work.$getRecord(key));
                }
            }, 20000);


            ////////////////////////////////////
            function pickOrder(transaction) {

                console.log(transaction.$id);

                if (isValidTransaction(transaction)) {

                    transferMoney(getAccountRef(transaction.from), transaction.amount, getAccountRef(ISA_NL), transaction.amount, false, transaction)
                        .then(function () {
                            toCurrency(transaction.amount, 'AUD').then(function (amountAUD) {
                                window.setTimeout(function () {
                                    transferMoney(getAccountRef(ISA_NL), transaction.amount, getAccountRef(ISA_NL_AUD), amountAUD, true, transaction)
                                        .then(function () {
                                            window.setTimeout(function () {
                                                transferMoney(getAccountRef(ISA_NL_AUD), amountAUD, getAccountRef(ISA_AUS), amountAUD, true, transaction)
                                                    .then(function () {
                                                        window.setTimeout(function () {
                                                            transferMoney(getAccountRef(ISA_AUS), amountAUD, getAccountRef(transaction.to), amountAUD, true, transaction)
                                                                .then(function () {
                                                                    $log.info("transaction " + amountAUD + " succeeded");
                                                                    notify.push({
                                                                        'transaction': transaction,
                                                                        'message': 'transaction succeeded'
                                                                    });
                                                                })

                                                        }, DELAY);
                                                    })
                                            }, DELAY);
                                        })
                                }, DELAY);
                            });
                        })
                }
                else {
                    $log.info("transaction rejected");
                    notify.push({'transaction': transaction, 'message': 'transaction invalid'});

                }
            }

            function isValidTransaction(transaction) {
                if (transaction.$id === null) return false;
                if (transaction.from === null) return false;
                if (transaction.to === null) return false;
                if (transaction.amount === null) return false;
                return true;
            }

            function getAccountRef(accountNumber) {
                $log.info("getting details for");
                $log.info(accountNumber);
                return new Firebase("https://instamoney.firebaseio.com/accounts/" + accountNumber);
            }

            function transferMoney(accountFrom, amountFrom, accountTo, amountTo, noBalanceCheck, transactionReference) {
                var accountFrom = $firebaseObject(accountFrom);

                return accountFrom.$loaded(function () {
                    if (noBalanceCheck || accountFrom.balance > amountFrom) {
                        accountFrom.balance = accountFrom.balance - amountFrom;
                    } else {
                        notify.push({'transaction': transactionReference, 'message': 'insufficient balance'});
                    }

                    return accountFrom.$save(function () {
                        var accountTo = $firebaseObject(accountTo);

                        return accountTo.$loaded(function () {
                            accountTo.balance = accountTo.balance + amountTo;
                            return accountTo.$save();
                        });

                    });
                })


            }


            function toCurrency(amount, currency) {

                return $http.get('http://api.fixer.io/latest').then(function (data) {
                    console.log(data);
                    return amount * data.data.rates.AUD;
                });

            }


        }
    )
;