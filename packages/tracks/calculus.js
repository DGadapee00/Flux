/** Compatibility map for the Calculus merge (D28). No course module imports another course. */
export const CALCULUS_SECTIONS = {
  mac2311: {
    u1: {
      s1: {
        unit: 'c1',
        section: 's1',
      },
      s2: {
        unit: 'c1',
        section: 's2',
      },
      s3: {
        unit: 'c1',
        section: 's3',
      },
      s4: {
        unit: 'c1',
        section: 's4',
      },
      s5: {
        unit: 'c1',
        section: 's5',
      },
      s6: {
        unit: 'c1',
        section: 's13',
      },
    },
    u2: {
      s1: {
        unit: 'c1',
        section: 's6',
      },
      s2: {
        unit: 'c1',
        section: 's7',
      },
      s3: {
        unit: 'c1',
        section: 's8',
      },
      s4: {
        unit: 'c1',
        section: 's9',
      },
      s5: {
        unit: 'c1',
        section: 's10',
      },
      s7: {
        unit: 'c1',
        section: 's12',
      },
      s6: {
        unit: 'c2',
        section: 's8',
      },
      s8: {
        unit: 'c1',
        section: 's13',
      },
    },
    u3: {
      s1: {
        unit: 'c2',
        section: 's1',
      },
      s2: {
        unit: 'c2',
        section: 's2',
      },
      s3: {
        unit: 'c2',
        section: 's3',
      },
      s4: {
        unit: 'c2',
        section: 's4',
      },
      s5: {
        unit: 'c2',
        section: 's5',
      },
      s6: {
        unit: 'c2',
        section: 's6',
      },
      s8: {
        unit: 'c2',
        section: 's7',
      },
      s7: {
        unit: 'c6',
        section: 's1',
      },
      s9: {
        unit: 'c2',
        section: 's11',
      },
    },
    u4: {
      s1: {
        unit: 'c2',
        section: 's9',
      },
      s7: {
        unit: 'c2',
        section: 's10',
      },
      s2: {
        unit: 'c3',
        section: 's1',
      },
      s3: {
        unit: 'c3',
        section: 's2',
      },
      s4: {
        unit: 'c3',
        section: 's3',
      },
      s5: {
        unit: 'c3',
        section: 's4',
      },
      s6: {
        unit: 'c3',
        section: 's5',
      },
      s8: {
        unit: 'c3',
        section: 's12',
      },
    },
  },
  mac2312: {
    u1: {
      s1: {
        unit: 'c3',
        section: 's6',
      },
      s2: {
        unit: 'c3',
        section: 's7',
      },
      s3: {
        unit: 'c3',
        section: 's8',
      },
      s5: {
        unit: 'c3',
        section: 's9',
      },
      s6: {
        unit: 'c3',
        section: 's10',
      },
      s4: {
        unit: 'c4',
        section: 's5',
      },
      s7: {
        unit: 'c3',
        section: 's12',
      },
    },
    u2: {
      s5: {
        unit: 'c3',
        section: 's11',
      },
      s1: {
        unit: 'c4',
        section: 's1',
      },
      s2: {
        unit: 'c4',
        section: 's2',
      },
      s3: {
        unit: 'c4',
        section: 's3',
      },
      s4: {
        unit: 'c4',
        section: 's4',
      },
      s6: {
        unit: 'c6',
        section: 's2',
      },
      s7: {
        unit: 'c3',
        section: 's12',
      },
    },
    u4: {
      s1: {
        unit: 'c5',
        section: 's1',
      },
      s2: {
        unit: 'c5',
        section: 's2',
      },
      s3: {
        unit: 'c5',
        section: 's3',
      },
      s4: {
        unit: 'c5',
        section: 's4',
      },
      s5: {
        unit: 'c5',
        section: 's5',
      },
      s6: {
        unit: 'c5',
        section: 's6',
      },
    },
    u3: {
      s1: {
        unit: 'c6',
        section: 's3',
      },
      s2: {
        unit: 'c6',
        section: 's4',
      },
      s3: {
        unit: 'c6',
        section: 's5',
      },
      s4: {
        unit: 'c6',
        section: 's6',
      },
      s5: {
        unit: 'c6',
        section: 's7',
      },
      s6: {
        unit: 'c6',
        section: 's8',
      },
      s7: {
        unit: 'c6',
        section: 's9',
      },
      s8: {
        unit: 'c6',
        section: 's10',
      },
      s9: {
        unit: 'c6',
        section: 's11',
      },
    },
  },
};
export const CALCULUS_DEFAULTS = {
  mac2311: {
    u1: ['c1', 'limits'],
    u2: ['c1', 'secant'],
    u3: ['c2', 'box'],
    u4: ['c3', 'riemann'],
  },
  mac2312: {
    u1: ['c3', 'solids'],
    u2: ['c3', 'numint'],
    u3: ['c6', 'taylor'],
    u4: ['c5', 'parametric'],
  },
};
export const CALCULUS_PROBLEM_UNITS = {
  mac2311: {
    'u1.lim.poly': 'c1',
    'u1.lim.hole': 'c1',
    'u1.lim.oneside': 'c1',
    'u1.lim.cont': 'c1',
    'u1.lim.laws': 'c1',
    'u1.lim.eps': 'c1',
    'u1.lim.squeeze': 'c1',
    'u1.lim.abs': 'c1',
    'u1.lim.line': 'c1',
    'u1.lim.jump': 'c1',
    'u2.def.quad': 'c1',
    'u2.power': 'c1',
    'u2.product': 'c1',
    'u2.quotient': 'c1',
    'u2.chain': 'c1',
    'u2.implicit': 'c1',
    'u2.rates': 'c2',
    'u2.sine': 'c1',
    'u2.sym.power': 'c1',
    'u2.sym.chain': 'c1',
    'u2.sym.trig': 'c1',
    'u2.sym.product': 'c1',
    'u3.box': 'c2',
    'u3.linear': 'c2',
    'u3.extrema': 'c2',
    'u3.mvt': 'c2',
    'u3.inflect': 'c2',
    'u3.lhopital': 'c6',
    'u3.sinc': 'c6',
    'u3.newton': 'c2',
    'u4.riem.left': 'c3',
    'u4.riem.mid': 'c3',
    'u4.riem.order': 'c3',
    'u4.ftc.accum': 'c3',
    'u4.power': 'c2',
    'u4.sub': 'c3',
    'u4.line': 'c3',
    'u4.sym.anti': 'c2',
    'u4.sym.sub': 'c3',
  },
  mac2312: {
    'u1.vol.disk': 'c3',
    'u1.vol.shell': 'c3',
    'u1.vol.ratio': 'c3',
    'u1.vol.same': 'c3',
    'u1.area.gap': 'c3',
    'u1.vol.washer': 'c3',
    'u1.arc.line': 'c4',
    'u1.work.spring': 'c3',
    'u2.parts.xsin': 'c4',
    'u2.trig.sq': 'c4',
    'u2.trigsub.arc': 'c4',
    'u2.partial.ln': 'c4',
    'u2.num.trap': 'c3',
    'u2.num.simp': 'c3',
    'u2.num.closer': 'c3',
    'u2.imp.tail': 'c6',
    'u2.sym.anti': 'c4',
    'u2.sym.parts': 'c4',
    'u3.tay.line': 'c6',
    'u3.tay.cubic': 'c6',
    'u3.tay.fifth': 'c6',
    'u3.tay.tighter': 'c6',
    'u3.tay.exp': 'c6',
    'u3.tay.shift': 'c6',
    'u3.tay.center': 'c6',
    'u3.tay.cos': 'c6',
    'u3.sym.taylor': 'c6',
    'u3.sym.sin': 'c6',
    'u3.sym.cos': 'c6',
    'u3.sym.ln': 'c6',
    'u3.sym.recip': 'c6',
    'u3.ser.geom': 'c6',
    'u3.ser.limit': 'c6',
    'u3.ser.harm': 'c6',
    'u3.ser.diverge': 'c6',
    'u3.ser.alt': 'c6',
    'u3.ser.ln2': 'c6',
    'u3.ser.square': 'c6',
    'u4.par.point': 'c5',
    'u4.par.slope': 'c5',
    'u4.par.length': 'c5',
    'u4.par.line': 'c5',
    'u4.par.arc': 'c5',
    'u4.pol.cart': 'c5',
    'u4.pol.disk': 'c5',
    'u4.pol.card': 'c5',
    'u4.pol.shift': 'c5',
    'u4.pol.factor': 'c5',
  },
};
export const CALCULUS_PROBLEM_LABS = {
  mac2311: {
    'u1.lim.poly': null,
    'u1.lim.hole': 'limits',
    'u1.lim.oneside': 'limits',
    'u1.lim.cont': null,
    'u1.lim.laws': null,
    'u1.lim.eps': 'limits',
    'u1.lim.squeeze': null,
    'u1.lim.abs': null,
    'u1.lim.line': null,
    'u1.lim.jump': 'limits',
    'u2.def.quad': 'secant',
    'u2.power': null,
    'u2.product': null,
    'u2.quotient': null,
    'u2.chain': null,
    'u2.implicit': null,
    'u2.rates': 'rates',
    'u2.sine': null,
    'u2.sym.power': null,
    'u2.sym.chain': null,
    'u2.sym.trig': null,
    'u2.sym.product': null,
    'u3.box': 'box',
    'u3.linear': null,
    'u3.extrema': null,
    'u3.mvt': null,
    'u3.inflect': null,
    'u3.lhopital': null,
    'u3.sinc': null,
    'u3.newton': null,
    'u4.riem.left': 'riemann',
    'u4.riem.mid': 'riemann',
    'u4.riem.order': null,
    'u4.ftc.accum': 'accum',
    'u4.power': null,
    'u4.sub': null,
    'u4.line': 'accum',
    'u4.sym.anti': null,
    'u4.sym.sub': null,
  },
  mac2312: {
    'u1.vol.disk': 'solids',
    'u1.vol.shell': 'solids',
    'u1.vol.ratio': 'solids',
    'u1.vol.same': null,
    'u1.area.gap': null,
    'u1.vol.washer': null,
    'u1.arc.line': 'arc',
    'u1.work.spring': null,
    'u2.parts.xsin': null,
    'u2.trig.sq': null,
    'u2.trigsub.arc': null,
    'u2.partial.ln': null,
    'u2.num.trap': 'numint',
    'u2.num.simp': 'numint',
    'u2.num.closer': null,
    'u2.imp.tail': 'improper',
    'u2.sym.anti': null,
    'u2.sym.parts': null,
    'u3.tay.line': 'taylor',
    'u3.tay.cubic': 'taylor',
    'u3.tay.fifth': 'taylor',
    'u3.tay.tighter': null,
    'u3.tay.exp': null,
    'u3.tay.shift': 'taylor',
    'u3.tay.center': null,
    'u3.tay.cos': null,
    'u3.sym.taylor': null,
    'u3.sym.sin': null,
    'u3.sym.cos': null,
    'u3.sym.ln': null,
    'u3.sym.recip': null,
    'u3.ser.geom': 'series',
    'u3.ser.limit': null,
    'u3.ser.harm': 'series',
    'u3.ser.diverge': null,
    'u3.ser.alt': 'series',
    'u3.ser.ln2': null,
    'u3.ser.square': null,
    'u4.par.point': 'parametric',
    'u4.par.slope': 'parametric',
    'u4.par.length': 'parametric',
    'u4.par.line': 'parametric',
    'u4.par.arc': 'parametric',
    'u4.pol.cart': null,
    'u4.pol.disk': 'polar',
    'u4.pol.card': 'polar',
    'u4.pol.shift': 'polar',
    'u4.pol.factor': null,
  },
};
export const calculusProblemId = (source, id) =>
  source === 'mac2312' && !id.startsWith('ii.') ? `ii.${id}` : id;
export const calculusProblemUnit = (source, id) =>
  CALCULUS_PROBLEM_UNITS[source]?.[id.replace(/^ii\./, '')] || null;

export const CALCULUS_LAB_UNITS = {
  limits: 'c1',
  secant: 'c1',
  rates: 'c2',
  box: 'c2',
  riemann: 'c3',
  accum: 'c3',
  solids: 'c3',
  numint: 'c3',
  arc: 'c4',
  parametric: 'c5',
  polar: 'c5',
  improper: 'c6',
  taylor: 'c6',
  series: 'c6',
};
const FIRST = { c1: 'limits', c2: 'rates', c3: 'riemann', c4: 'arc', c5: 'parametric', c6: 'improper' };
const OLD_LABS = {
  mac2311: { limits: 'u1', secant: 'u2', rates: 'u2', box: 'u3', riemann: 'u4', accum: 'u4' },
  mac2312: {
    solids: 'u1',
    arc: 'u1',
    numint: 'u2',
    improper: 'u2',
    taylor: 'u3',
    series: 'u3',
    parametric: 'u4',
    polar: 'u4',
  },
};
/** Rewrite legacy links, including notes anchors and problem seeds, without browser state. */
export function calculusDestination(hash, source = 'mac2311') {
  const full = String(hash || '').replace(/^#\/?/, '');
  const at = full.indexOf('?');
  const path = at < 0 ? full : full.slice(0, at),
    query = at < 0 ? '' : full.slice(at);
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'mac2311' || parts[0] === 'mac2312') source = parts.shift();
  const [oldUnit, second] = parts;
  // A distinct unit namespace prevents old u2 notes from colliding with new Unit 2 notes.
  if (/^c[1-6]$/.test(oldUnit || '')) return `#/mac2311/${parts.join('/')}${query}`;
  const bare = CALCULUS_LAB_UNITS[oldUnit] ? oldUnit : null;
  const lab = second && CALCULUS_LAB_UNITS[second] ? second : bare;
  const legacyUnit = bare ? OLD_LABS[source]?.[bare] : oldUnit || 'u1';
  let [unit, chosenLab] = CALCULUS_DEFAULTS[source]?.[legacyUnit] || CALCULUS_DEFAULTS[source].u1;
  if (lab) {
    unit = CALCULUS_LAB_UNITS[lab];
    chosenLab = lab;
  }
  const params = new URLSearchParams(query);
  const problem = params.get('p');
  if (problem) {
    const canonical = calculusProblemId(source, problem);
    params.set('p', canonical);
    const original = problem.replace(/^ii\./, '');
    const target = calculusProblemUnit(source, original);
    if (target) {
      unit = target;
      chosenLab = CALCULUS_PROBLEM_LABS[source]?.[original] || FIRST[unit];
    }
  } else if (params.has('n')) {
    const target = CALCULUS_SECTIONS[source]?.[legacyUnit]?.[params.get('n')];
    if (target) {
      unit = target.unit;
      params.set('n', target.section);
      if (CALCULUS_LAB_UNITS[chosenLab] !== unit) chosenLab = FIRST[unit];
    }
  }
  const suffix = params.toString();
  return `#/mac2311/${unit}/${chosenLab}${suffix ? '?' + suffix : ''}`;
}
