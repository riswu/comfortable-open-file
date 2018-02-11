# comfortable-open-file

Comfortable Open File is a package like
[Advanced Open File](https://github.com/Osmose/advanced-open-file).
The Package helps Atom users to open files.
Moving directories, Atom user can comfortably open files,
create files, add project directories and remove project directories.

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

- <kbd>ctrl-+</kbd>: Add the selected directory to project folder.
- <kbd>ctrl--</kbd>: Remove the selected directory from project folder.

If you have installed [File Icons](https://github.com/file-icons/atom), icons change.

![Screenshot of plugin](https://user-images.githubusercontent.com/21008974/36074883-be27ea0c-0f89-11e8-9230-b495e8e434ef.png)

## Keybindings

Available commands for binding:

- `comfortable-open-file:toggle`: open/close
- `comfortable-open-file:add-project-folder`: add project folder
- `comfortable-open-file:removeProjectFolder`: open project folder
- `core:move-up`: move up
- `core:move-down`: move down
- `core:confirm`: confirm
- `core:cancel`: cancel
