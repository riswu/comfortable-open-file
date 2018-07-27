# comfortable-open-file

Comfortable Open File is a package like
[Advanced Open File](https://github.com/Osmose/advanced-open-file).
The package helps Atom users to open files.
Atom users can comfortably open files,
create files, add project folders and remove project folders.

![Screenshot of plugin](https://user-images.githubusercontent.com/21008974/36074882-bdecee48-0f89-11e8-8b22-016614704c01.png)

## Usage

Press <kbd>ctrl-alt-c</kbd> to open the file list and the query editor.
If you have already opened a file, you can get the file list of current directory.
Otherwise you can get that of a directory you set up.

As you edit query, the file list is updated automatically.
Even if you do mistyping, you can use fuzzy search at the directory level.

If the file does not exist, you can create the file.
Similarly, you can create a directory.

You can open the selected file or move the directory by pressing <kbd>enter</kbd>.

Other features:

- <kbd>ctrl-l</kbd>: Move to the parent directory of the current directory.
- <kbd>ctrl-+</kbd>: Add the selected directory to project folders.
- <kbd>ctrl--</kbd>: Remove the selected directory from project folders.

## Keybindings

Available commands for binding:

- `comfortable-open-file:toggle`: toggle
- `comfortable-open-file:move-up-directory`: move up directory
- `comfortable-open-file:add-project-folder`: add project folder
- `comfortable-open-file:removeProjectFolder`: remove project folder
- `core:move-up`: move up
- `core:move-down`: move down
- `core:confirm`: confirm
- `core:cancel`: cancel
