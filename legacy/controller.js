angular.module('capitalGame', [])
  .controller('GameCtrl', function ($scope) {
    var data = {
      Germany: 'Berlin',
      Azerbaijan: 'Baku',
      Poland: 'Warsaw',
      'Papua New Guinea': 'Port Moresby'
    };

    function shuffle(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    }

    function buildButtons(source) {
      var buttons = [];
      Object.keys(source).forEach(function (country) {
        var capital = source[country];
        buttons.push({ id: 'c-' + country, label: country, pairId: capital, color: null });
        buttons.push({ id: 'k-' + capital, label: capital, pairId: country, color: null });
      });
      return buttons;
    }

    $scope.buttons = shuffle(buildButtons(data));
    $scope.selected = [];
    // Part 1, task 2: correct-match counter, rendered by {{ score }} in game.html.
    $scope.score = 0;

    $scope.select = function (btn) {
      if ($scope.selected.length === 2) {
        // Part 1, task 1 — wrong-pair reset bug fix.
        // Rule 5 requires BOTH red buttons to return to their default colour on the
        // third click. The original code reset only $scope.selected[0], leaving the
        // second button stuck red. Reset every button still held in `selected`.
        $scope.selected.forEach(function (selectedBtn) {
          selectedBtn.color = null;
        });
        $scope.selected = [];
      }

      btn.color = 'blue';
      $scope.selected.push(btn);

      if ($scope.selected.length === 2) {
        $scope.checkPair();
      }
    };

    $scope.checkPair = function () {
      var a = $scope.selected[0];
      var b = $scope.selected[1];
      var isMatch = a.pairId === b.label && b.pairId === a.label;

      if (isMatch) {
        $scope.buttons = $scope.buttons.filter(function (btn) {
          return btn.id !== a.id && btn.id !== b.id;
        });
        $scope.selected = [];
        $scope.score++;

        if ($scope.buttons.length === 0) {
          document.getElementById('game-message').innerText = 'Congratulations';
        }
      } else {
        a.color = 'red';
        b.color = 'red';
      }
    };

    // CODE REVIEW FLAG (not fixed, per brief): checkPair() writes the win message via
    // document.getElementById instead of binding a $scope property. It bypasses Angular's
    // digest, couples the controller to the markup, and makes the end state hard to test.
  });
