# typed: false
# frozen_string_literal: true

class Wrap < Formula
  desc "Generates 'wraps' for functions in any language using 'processors'"
  homepage "https://github.com/Yarden-zamir/WRAP"
  url "https://github.com/Yarden-zamir/WRAP/archive/v0.2.94.tar.gz"
  sha256 "32de02a5026d02065534879818ff6fd8ccc124386fd10110b7e819114d7a5cdc"
  license "MIT"

  depends_on "python@3.11"

  def install
    libexec.install Dir["*"]
    bin.write_exec_script libexec/"wrap"
    (libexec/"VERSION").write version
  end

  def caveats
    <<~EOS
      To activate wrap, run the following command:
        wrap install
      You can also use
        wrap install --help
      for custom installation.
    EOS
  end
end
