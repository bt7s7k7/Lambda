# Lambda
Simple lambda calculus implementation.
## Usage
Each line is a lambda calculus expression. Lambda is replaced with `>`, dots after arguments are removed. Short hand currying is not allowed.
````
C := λfab. f b a

      |
      V
      
C = >f>a>b f b a
````

Type command `debug` to activate debug mode. It will print expression makeup and step by step reduction.

There are some premade modules with functions. Import a module using `import <name>` command. Modules:
````
std - Imported by default, contains identity, kestrel...
logic - Contains true, false, and, or...
````
## Example
- Define identity function
````
I = >a a
````
- Define logical and
````
and = >a>b a (b true false) false
````
