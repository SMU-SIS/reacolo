start
  = ws? result:groups ws? { return result; }

ws "whitespaces"
    = [ \t\r\n]+

and "and"
  = ws? "\&" ws?

or "or"
  = ws? "\|" ws?

optionalSuffix "?"
  = ws? "?"

groups "admissible target groups"
  = gr:group or grs:groups  { return [gr].concat(grs); }
  / gr:group                { return [gr]; }

group "admissible target group"
  = t:target and gr:group   { return Object.assign(t, gr); }
  / target

target "target"
  = name:name os:optionalSuffix? { return { [name]: { optional: !!os } } }

name "target name"
  = chars:[0-9a-zA-Z_]+       { return chars.join(''); }
  / "*"
