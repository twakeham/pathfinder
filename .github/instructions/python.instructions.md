---
applyTo: '*.py'
---

# Style Guide
Language: Python
Goal: To guide an AI agent in creating Python code that adheres to these style guidelines.

## Naming Conventions

Use snake_case for all variable names, function names, and method names
Use PascalCase for class names
Use UPPER_SNAKE_CASE for constants
Use descriptive names that clearly indicate purpose (e.g., header_rect, tool_class, zoom_in_factor)
Use single-letter variables only for very short-lived loop counters or mathematical operations

## Class Structure

Place class-level attributes before the __init__ method
Group related class attributes together (e.g., style attributes, dimension attributes, configuration lists)
Define class attributes as simple assignments without complex logic
Place methods in logical order: __init__, then public methods, then private methods
Use super().__init__() for inheritance, with explicit parent class name when clarity is needed

## Method and Function Structure

Use type hints for method parameters and return values
Place the most complex logic in separate methods rather than cramming into __init__
Keep methods focused on a single responsibility
Use early returns to reduce nesting depth
Group related functionality into helper methods

## Import Organization

Place standard library imports first
Place third-party imports second
Place local/project imports last
Use specific imports rather than wildcard imports (avoid from module import *)
Group imports logically and separate groups with blank lines

## Code Organization and Spacing

Use exactly one blank line between methods within a class
Use two blank lines between classes
Use blank lines to separate logical sections within methods
Place related statements close together without unnecessary blank lines
Align related assignments and parameters when it improves readability

## Comments and Documentation

Avoid redundant comments that simply restate the code
Use comments when the code's purpose is not self-evident
Use # TODO comments for incomplete functionality
Prefer self-documenting code over extensive comments
When comments are needed, use concise, clear language
Docstrings should be created to explain the use of methods

## Error Handling and Defensive Programming

Use hasattr() checks before accessing dynamic attributes
Handle None values explicitly with or defaults (e.g., inputs or self.inputs)
Use isinstance() for type checking when necessary
Implement proper exception handling without bare except: clauses

## Variable and Object Management

Use descriptive temporary variables for complex calculations
Store frequently accessed properties in local variables
Use tuple unpacking for methods that return multiple related values
Initialize collections as empty lists/dicts at class level when they serve as defaults

## Control Flow

Use if/else for binary choices rather than multiple if statements
Use early returns to reduce nesting
Use not for negation rather than == False
Use in operator for membership testing

## File Organization

Keep related classes in the same file when they're tightly coupled
Use clear, descriptive filenames that match the primary class or functionality
Organize imports at the top of each file
Keep files focused on a single major concept or closely related functionality

## Magic Methods and Special Cases

Implement __getattr__ for dynamic attribute access when building flexible systems
Use __dict__ manipulation sparingly and only when building meta-programming features
Implement comparison and container methods when objects need to be compared or stored in collections

## String and Text Handling

Use f-strings for string formatting
Use + for concatenating multiple strings
Use regular expressions for complex string manipulation
Use meaningful variable names for regex patterns and results