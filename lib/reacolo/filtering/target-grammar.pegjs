start
  = ws? result:targetsOr ws? { return result; }

ws "whitespaces"
    = [ \t\r\n]+

and "and"
  = (ws? "\&" ws?)

or "or"
  = ws? "\|" ws?

optionalSuffix "?"
  = ws? "?"

targetsOr "target or target"
  = ta:targetsAnd or to:targetsOr   { return ta.concat(to); }
  / targetsAnd

targetsAnd "target and target"
  = t:target and ta:targetsAnd      {
                                      return t.reduce((res, ti) => res.concat(
                                          ta.map((tai) => Object.assign({}, ti, tai))
                                      ),[]);
                                    }
  / target

target "target"
  = name:name os:optionalSuffix?    { return [{ [name]: { optional: !!os } }]; }
  / "(" ws? to:targetsOr ws? ")"    { return to; }

name "target name"
  = chars:[0-9a-zA-Z_]+             { return chars.join(''); }
  / "*"
