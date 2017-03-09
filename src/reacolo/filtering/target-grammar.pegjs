start
  = ws? result:targetsOr ws? { return result; }

ws "whitespaces"
    = [ \t\r\n]+

and "and"
  = (ws? "\&" ws?) / ws

or "or"
  = ws? "\|" ws?

optionalSuffix "?"
  = ws? "?"

targetsOr "target or target"
  = ta:targetsAnd or to:targetsOr   { return ta.concat(to); }
  / targetsAnd

targetsAnd "target and target"
  = t:target and ta:targetsAnd      {
                                      return t.map(ti => ta.map((tai) => ti.concat(tai)))
                                              .reduce((res, tati) => res.concat(tati));
                                    }
  / target

target "target"
  = name:name os:optionalSuffix?    { return [[{ name, optional: !!os }]]; }
  / "(" ws? to:targetsOr ws? ")"    { return to; }

name "target name"
  = chars:[^\(\)\&\| \t\r\n\.\?]+             { return chars.join(''); }
  / "\."
