'use strict';

angular.module('myApp.view1', ['ngRoute', "firebase"])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', function ($firebaseObject, $firebaseArray) {

            var workFB = new Firebase("https://instamoney.firebaseio.com/work_queue");
            var notifyFB = new Firebase("https://instamoney.firebaseio.com/notify_queue");
            const ISA_NL = "NL99INGB2348573645";
            const ISA_NL_AUD = "NL77INGB4758476399";
            const ISA_AUS = "AU484744644";
            const DELAY = 1000;


            var notify = $firebaseArray(notifyFB);
            var work = $firebaseArray(workFB);

            window.setInterval(function () {
                if (work.length > 0) {
                    var key = work.$keyAt(0);
                    pickOrder(work.$getRecord(key));
                }
            }, 10000);


            ////////////////////////////////////
            function pickOrder(transaction) {

                console.log(transaction.$id);

                if (isValidTransaction(transaction)) {

                    transferMoney(getAccountRef(transaction.from), transaction.amount, getAccountRef(ISA_NL), transaction.amount, false);
                    toCurrency(amount, AUD).then(function(amountAUD) {

                        window.setTimeout(function (){
                            transferMoney(getAccountRef(getAccountRef(ISA_NL), transaction.amount, getAccountRef(ISA_NL_AUD), amountAUD), true);
                        }, DELAY);

                        window.setTimeout(function (){
                            transferMoney(getAccountRef(getAccountRef(ISA_NL_AUD), amountAUD, getAccountRef(ISA_AUS), amountAUD), true);
                        }, DELAY);

                        window.setTimeout(function (){
                            transferMoney(getAccountRef(getAccountRef(ISA_AUS), amountAUD, getAccountRef(transaction.to), amountAUD), true);
                        }, DELAY);
                        
                        notify.push({'transaction': transaction, 'message': 'transaction succeeded'});
                    });
                } else {
                    notify.push({'transaction': transaction, 'message': 'transaction invalid'});

                }
            }

            function isValidTransaction(transaction) {
                if (transaction.$id == null) return false;
                if (transaction.from == null) return false;
                if (transaction.to == null) return false;
                if (transaction.amount == null) return false;
            }

            function getAccountRef(accountNumber) {
                return $firebaseObject(new Firebase("https://instamoney.firebaseio.com/accounts/" + accountNumber));
            }

            function transferMoney(accountFrom, accountTo, amount, noBalanceCheck) {
                var balance = accountFrom.child("/balance");

                if (noBalanceCheck || balance > amount) {
                    balance.set(balance - amount);

                } else {
                    notify.push({'transaction': transaction, 'message': 'insufficient balance'});
                }
            }

            function toCurrency(amount, currency) {

                return $http.get('http://api.fixer.io/latest').then(function(data) {
                    return amount * data.rates.AUD;
                });

            }



        }
    );