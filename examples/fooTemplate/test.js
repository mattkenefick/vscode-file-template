console.log('Foo bar');

${env.USER}

${{
	Date.now()
}}
;;;

Variables: ${{ JSON.stringify(variables) }}

${{ variables.package_version }}

WORKSPACE: ${{ workspaceRoot }}
INPUT: ${{ inputPath }}
OUTPUT: ${{ outputPath }}
INPUT RELATIVE: ${{ inputPathRelative }}
OUTPUT RELATIVE: ${{ outputPathRelative }}
INPUT FILENAME: ${{ inputFilename }}
OUTPUT FILENAME: ${{ outputFilename }}

${{
	const [major, minor, patch] = variables.package_version.split('.');

	`Major: ${major}\nMinor: ${minor}\nPatch: ${patch}`
}}

-----

${{
	if (variables.package_author.indexOf('Kenefick') > -1) {
		`It's Matt.`
	}
	else {
		`It's someone else.`
	}
}}
