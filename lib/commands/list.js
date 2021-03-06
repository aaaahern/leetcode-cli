var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;

var core = require('../core');
var h = require('../helper');

var cmd = {
  command: 'list [keyword]',
  desc:    'list problems',
  builder: {
    keyword: {
      type:     'string',
      describe: 'Filter problems by keyword'
    },
    query: {
      alias:    'q',
      type:     'string',
      describe: 'Filter problems by conditions:\n' +
                'e(easy),m(medium),h(hard),d(done),l(locked)\n' +
                'Uppercase means negative, e.g. D(not done)'
    },
    stat: {
      alias:    's',
      type:     'boolean',
      describe: 'Show problems statistics'
    }
  }
};

function byLevel(x, q) {
  return x.level[0].toLowerCase() === q.toLowerCase();
}

function byStateAC(x, q) {
  return x.state === 'ac';
}

function byLocked(x, q) {
  return x.locked;
}

var QUERY_HANDLERS = {
  e: byLevel,
  E: _.negate(byLevel),
  m: byLevel,
  M: _.negate(byLevel),
  h: byLevel,
  H: _.negate(byLevel),
  l: byLocked,
  L: _.negate(byLocked),
  d: byStateAC,
  D: _.negate(byStateAC)
};

cmd.handler = function(argv) {
  core.getProblems(function(e, problems) {
    if (e) return console.log('ERROR:', e);

    var all = problems.length;

    if (argv.query) {
      argv.query.split('').forEach(function(q) {
        var f = QUERY_HANDLERS[q];
        if (!f) return;

        problems = _.filter(problems, _.partial(f, _, q));
      });
    }

    if (argv.keyword) {
      problems = _.filter(problems, function(x) {
        return x.name.toLowerCase().indexOf(argv.keyword) !== -1;
      });
    }

    var stat = {locked: 0};
    problems.forEach(function(problem) {
      stat[problem.level] = (stat[problem.level] || 0) + 1;
      stat[problem.state] = (stat[problem.state] || 0) + 1;
      if (problem.locked) ++stat.locked;

      console.log(sprintf('%s %s [%3d] %-60s %-6s (%s)',
            h.prettyState(problem.state),
            (problem.locked ? '🔒' : ' '),
            problem.id, problem.name,
            problem.level, problem.percent));
    });

    if (argv.stat) {
      console.log();
      console.log(sprintf('  All:  %-9d Listed: %-9d Lock: %-9d',
            all, problems.length, stat.locked));
      console.log(sprintf('  AC:   %-9d Not-AC: %-9d New:  %-9d',
            (stat.ac || 0), (stat.notac || 0), (stat.None || 0)));
      console.log(sprintf('  Easy: %-9d Medium: %-9d Hard: %-9d',
            (stat.Easy || 0), (stat.Medium || 0), (stat.Hard || 0)));
    }
  });
};

module.exports = cmd;
